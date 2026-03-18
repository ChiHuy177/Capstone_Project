"""
PDF Extractor v2 - Cải thiện extraction với semantic awareness
"""
import pdfplumber
import re
from typing import List, Tuple
from langchain_core.documents import Document


def clean_text(text: str) -> str:
    """Làm sạch text"""
    if not text:
        return ""

    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)

    # Remove weird characters nhưng giữ tiếng Việt
    text = re.sub(r'[^\w\s\.,;:!?\-\(\)\[\]\"\'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ%/]', '', text)

    return text.strip()


def format_table_as_text(table: List[List], table_idx: int) -> str:
    """
    Format table thành text có cấu trúc, dễ đọc cho LLM
    """
    if not table or len(table) == 0:
        return ""

    lines = []
    header_row = table[0] if table else []

    # Xác định header
    headers = [str(cell).strip() if cell else f"Cột_{i}" for i, cell in enumerate(header_row)]

    # Format từng row thành câu có nghĩa
    for row_idx, row in enumerate(table[1:], start=1):
        row_parts = []
        for col_idx, cell in enumerate(row):
            if cell and str(cell).strip():
                header_name = headers[col_idx] if col_idx < len(headers) else f"Cột_{col_idx}"
                row_parts.append(f"{header_name}: {str(cell).strip()}")

        if row_parts:
            lines.append("; ".join(row_parts) + ".")

    return "\n".join(lines)


def detect_sections(text: str) -> List[Tuple[str, str]]:
    """
    Phát hiện các section/heading trong text
    Returns: List of (section_title, section_content)
    """
    # Patterns cho các heading phổ biến trong tài liệu tuyển sinh
    heading_patterns = [
        r'^(I+\.|[0-9]+\.|[A-Z]\.|•|\-)\s*(.+?)$',  # I. II. 1. 2. A. B.
        r'^(CHƯƠNG|PHẦN|MỤC|ĐIỀU)\s+[IVX0-9]+[:\.]?\s*(.+?)$',
        r'^([A-ZĐÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸ\s]{5,50}):?\s*$',  # ALL CAPS headers
    ]

    sections = []
    current_section = ""
    current_content = []

    lines = text.split('\n')

    for line in lines:
        line = line.strip()
        if not line:
            continue

        is_heading = False
        for pattern in heading_patterns:
            if re.match(pattern, line, re.IGNORECASE | re.MULTILINE):
                # Lưu section trước đó
                if current_section or current_content:
                    sections.append((current_section, '\n'.join(current_content)))

                current_section = line
                current_content = []
                is_heading = True
                break

        if not is_heading:
            current_content.append(line)

    # Lưu section cuối cùng
    if current_section or current_content:
        sections.append((current_section, '\n'.join(current_content)))

    return sections


def extract_pdf_semantic(file_path: str) -> List[Document]:
    """
    Extract PDF với semantic awareness
    - Giữ nguyên tables trong 1 document
    - Tách sections riêng biệt
    - Clean text
    """
    documents = []

    try:
        with pdfplumber.open(file_path) as pdf:
            full_text_parts = []
            all_tables = []

            for page_num, page in enumerate(pdf.pages, start=1):
                # Extract text
                text = page.extract_text() or ""
                text = clean_text(text)

                if text:
                    full_text_parts.append({
                        "page": page_num,
                        "content": text
                    })

                # Extract tables riêng
                tables = page.extract_tables()
                for table_idx, table in enumerate(tables, start=1):
                    if table and len(table) > 1:  # Có ít nhất header + 1 row
                        table_text = format_table_as_text(table, table_idx)
                        if table_text.strip():
                            all_tables.append({
                                "page": page_num,
                                "table_idx": table_idx,
                                "content": table_text,
                                "raw_table": table
                            })

            # Tạo documents cho text (theo page hoặc section)
            for part in full_text_parts:
                # Detect sections trong page
                sections = detect_sections(part["content"])

                if sections and len(sections) > 1:
                    # Có nhiều sections → tạo document cho mỗi section
                    for section_title, section_content in sections:
                        if section_content.strip():
                            documents.append(Document(
                                page_content=f"{section_title}\n{section_content}".strip(),
                                metadata={
                                    "page": part["page"],
                                    "source": file_path,
                                    "type": "text",
                                    "section": section_title[:100] if section_title else "general",
                                    "total_pages": len(pdf.pages)
                                }
                            ))
                else:
                    # Không có section rõ ràng → giữ nguyên page
                    documents.append(Document(
                        page_content=part["content"],
                        metadata={
                            "page": part["page"],
                            "source": file_path,
                            "type": "text",
                            "section": "general",
                            "total_pages": len(pdf.pages)
                        }
                    ))

            # Tạo documents cho tables (mỗi table = 1 document riêng)
            for table_info in all_tables:
                documents.append(Document(
                    page_content=table_info["content"],
                    metadata={
                        "page": table_info["page"],
                        "source": file_path,
                        "type": "table",
                        "table_index": table_info["table_idx"],
                        "total_pages": len(pdf.pages)
                    }
                ))

        return documents

    except Exception as e:
        raise Exception(f"Lỗi khi extract PDF: {str(e)}")


def extract_pdf_for_qa(file_path: str) -> List[Document]:
    """
    Extract PDF tối ưu cho Q&A về tuyển sinh
    - Nhận diện các loại thông tin: điểm chuẩn, học phí, ngành học, etc.
    - Group thông tin liên quan lại với nhau
    """
    documents = []

    # Keywords để phân loại nội dung
    categories = {
        "diem_chuan": ["điểm chuẩn", "điểm trúng tuyển", "điểm xét tuyển", "điểm sàn"],
        "hoc_phi": ["học phí", "chi phí", "phí", "miễn giảm", "học bổng"],
        "nganh_hoc": ["ngành", "chuyên ngành", "khoa", "chương trình"],
        "tuyen_sinh": ["xét tuyển", "đăng ký", "hồ sơ", "thời gian", "điều kiện"],
        "co_so_vat_chat": ["cơ sở", "ký túc xá", "thư viện", "phòng lab"],
        "lien_he": ["liên hệ", "địa chỉ", "email", "hotline", "điện thoại"]
    }

    try:
        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                text = page.extract_text() or ""
                text = clean_text(text)

                if not text:
                    continue

                # Phân loại content
                detected_category = "general"
                for cat, keywords in categories.items():
                    if any(kw in text.lower() for kw in keywords):
                        detected_category = cat
                        break

                # Extract tables
                tables = page.extract_tables()
                table_content = ""
                for table in tables:
                    if table and len(table) > 1:
                        table_content += "\n" + format_table_as_text(table, 1)

                # Combine text + tables
                full_content = text
                if table_content:
                    full_content += "\n\n" + table_content

                documents.append(Document(
                    page_content=full_content,
                    metadata={
                        "page": page_num,
                        "source": file_path,
                        "category": detected_category,
                        "has_table": bool(tables),
                        "total_pages": len(pdf.pages)
                    }
                ))

        return documents

    except Exception as e:
        raise Exception(f"Lỗi khi extract PDF: {str(e)}")
