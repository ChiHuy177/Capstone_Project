"""
Search Utilities - Query preprocessing và helpers
"""
import re
from typing import List, Dict, Tuple


# Synonyms cho domain tuyển sinh
SYNONYMS = {
    "học phí": ["chi phí", "phí", "tiền học", "học phí"],
    "điểm chuẩn": ["điểm trúng tuyển", "điểm xét tuyển", "điểm sàn", "điểm chuẩn"],
    "ngành": ["chuyên ngành", "ngành học", "khoa", "ngành"],
    "xét tuyển": ["tuyển sinh", "đăng ký", "nộp hồ sơ", "xét tuyển"],
    "học bổng": ["miễn giảm", "hỗ trợ tài chính", "scholarship", "học bổng"],
    "ký túc xá": ["ktx", "nội trú", "chỗ ở", "ký túc xá"],
    "chỉ tiêu": ["số lượng", "quota", "chỉ tiêu tuyển sinh", "chỉ tiêu"],
    "thời gian": ["khi nào", "bao giờ", "deadline", "hạn", "thời gian"],
    "điều kiện": ["yêu cầu", "tiêu chí", "cần gì", "điều kiện"],
    "cntt": ["công nghệ thông tin", "it", "cntt", "tin học"],
    "eiu": ["đại học quốc tế miền đông", "eastern international university", "eiu"],
}

# Question patterns để detect intent
QUESTION_PATTERNS = {
    "diem_chuan": [
        r"điểm chuẩn",
        r"điểm xét tuyển",
        r"điểm trúng tuyển",
        r"bao nhiêu điểm",
        r"cần bao nhiêu điểm"
    ],
    "hoc_phi": [
        r"học phí",
        r"chi phí",
        r"phí",
        r"tiền học",
        r"bao nhiêu tiền",
        r"đóng bao nhiêu"
    ],
    "nganh_hoc": [
        r"ngành",
        r"chuyên ngành",
        r"học gì",
        r"có những ngành",
        r"đào tạo"
    ],
    "tuyen_sinh": [
        r"xét tuyển",
        r"đăng ký",
        r"nộp hồ sơ",
        r"tuyển sinh",
        r"cách đăng ký"
    ],
    "hoc_bong": [
        r"học bổng",
        r"miễn giảm",
        r"hỗ trợ",
        r"scholarship"
    ],
    "thoi_gian": [
        r"khi nào",
        r"bao giờ",
        r"thời gian",
        r"deadline",
        r"hạn"
    ]
}


def normalize_vietnamese(text: str) -> str:
    """Normalize Vietnamese text"""
    if not text:
        return ""

    # Lowercase
    text = text.lower().strip()

    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)

    return text


def expand_query(query: str) -> List[str]:
    """
    Expand query với synonyms
    Returns list of expanded queries
    """
    query_lower = normalize_vietnamese(query)
    expanded = [query]  # Original query

    for key, synonyms in SYNONYMS.items():
        if key in query_lower:
            for syn in synonyms:
                if syn != key and syn not in query_lower:
                    # Tạo query mới với synonym
                    new_query = query_lower.replace(key, syn)
                    if new_query not in expanded:
                        expanded.append(new_query)

    return expanded[:5]  # Max 5 expanded queries


def detect_intent(query: str) -> List[str]:
    """
    Detect intent/category từ query
    Returns list of detected intents
    """
    query_lower = normalize_vietnamese(query)
    intents = []

    for intent, patterns in QUESTION_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, query_lower):
                intents.append(intent)
                break

    return intents if intents else ["general"]


def extract_keywords(query: str) -> List[str]:
    """
    Extract important keywords từ query
    """
    # Stopwords tiếng Việt
    stopwords = {
        "là", "của", "và", "có", "được", "trong", "cho", "với", "này",
        "đó", "những", "các", "một", "để", "khi", "từ", "về", "theo",
        "như", "tôi", "bạn", "mình", "em", "anh", "chị", "ơi", "ạ",
        "không", "có", "phải", "thì", "mà", "vì", "nên", "hay", "hoặc",
        "gì", "nào", "sao", "làm", "thế", "cái", "con", "người"
    }

    query_lower = normalize_vietnamese(query)

    # Tokenize đơn giản
    words = re.findall(r'\b\w+\b', query_lower)

    # Filter stopwords và words quá ngắn
    keywords = [w for w in words if w not in stopwords and len(w) > 1]

    return keywords


def rerank_results(
    results: List[Tuple],
    query: str,
    intents: List[str]
) -> List[Tuple]:
    """
    Rerank results dựa trên:
    - Keyword match
    - Intent match
    - Original score
    """
    keywords = extract_keywords(query)
    reranked = []

    for doc, score in results:
        content_lower = doc.page_content.lower()
        metadata = doc.metadata

        # Base score (convert distance to similarity)
        final_score = 1 - score

        # Boost nếu có keyword match
        keyword_matches = sum(1 for kw in keywords if kw in content_lower)
        if keyword_matches > 0:
            final_score += 0.1 * min(keyword_matches, 3)  # Max +0.3

        # Boost nếu intent match với category
        doc_category = metadata.get("category", "general")
        if doc_category in intents:
            final_score += 0.15

        # Boost nếu là table và query hỏi về số liệu
        if metadata.get("type") == "table":
            number_keywords = ["bao nhiêu", "điểm", "phí", "tiền", "số"]
            if any(kw in query.lower() for kw in number_keywords):
                final_score += 0.1

        # Penalty nếu chunk quá ngắn
        if len(doc.page_content) < 100:
            final_score -= 0.1

        reranked.append((doc, final_score))

    # Sort by final score (descending)
    reranked.sort(key=lambda x: x[1], reverse=True)

    return reranked


def format_context_for_llm(results: List[Tuple], max_tokens: int = 2000) -> str:
    """
    Format search results thành context cho LLM
    - Loại bỏ duplicates
    - Truncate nếu quá dài
    - Thêm source info
    """
    seen_contents = set()
    context_parts = []
    total_length = 0

    for doc, score in results:
        content = doc.page_content.strip()

        # Skip duplicates (exact or near-duplicate)
        content_hash = hash(content[:100])
        if content_hash in seen_contents:
            continue
        seen_contents.add(content_hash)

        # Format với source
        source_file = doc.metadata.get("source_file", "unknown")
        page = doc.metadata.get("page", "?")
        doc_type = doc.metadata.get("type", "text")

        formatted = f"[Nguồn: {source_file}, Trang {page}, Loại: {doc_type}]\n{content}"

        # Check length
        if total_length + len(formatted) > max_tokens * 4:  # ~4 chars per token
            break

        context_parts.append(formatted)
        total_length += len(formatted)

    return "\n\n---\n\n".join(context_parts)
