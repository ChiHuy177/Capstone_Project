"""
Semantic Text Splitter - Chia chunks thông minh hơn
"""
from typing import List, Optional
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
import re


class SemanticTextSplitter:
    """
    Text splitter với semantic awareness
    - Không cắt giữa câu
    - Không cắt giữa bảng
    - Ưu tiên chia theo paragraph/section
    """

    def __init__(
        self,
        chunk_size: int = 800,
        chunk_overlap: int = 100,
        min_chunk_size: int = 100
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size

        # Separators theo thứ tự ưu tiên (semantic → character)
        self.separators = [
            "\n\n\n",      # Multiple newlines (section break)
            "\n\n",        # Paragraph break
            ".\n",         # Sentence + newline
            ";\n",         # Semicolon + newline
            ". ",          # End of sentence
            "; ",          # Semicolon
            ", ",          # Comma
            " ",           # Space
            ""             # Character
        ]

    def _is_table_content(self, text: str) -> bool:
        """Kiểm tra text có phải là table content không"""
        # Patterns cho table
        table_indicators = [
            r'\|.*\|',           # Có ký tự |
            r'^\s*\d+\.\s',      # Numbered list
            r'Cột_\d+:',         # Our table format
            r'---\s*BẢNG',       # Table marker
        ]
        return any(re.search(p, text) for p in table_indicators)

    def _split_by_separator(self, text: str, separator: str) -> List[str]:
        """Split text by separator, keeping separator at end of chunks"""
        if not separator:
            return list(text)

        parts = text.split(separator)
        # Add separator back to each part except the last
        result = []
        for i, part in enumerate(parts):
            if i < len(parts) - 1:
                result.append(part + separator)
            elif part:  # Don't add empty last part
                result.append(part)
        return result

    def _merge_chunks(self, chunks: List[str], separator: str) -> List[str]:
        """Merge small chunks together đến khi đạt chunk_size"""
        if not chunks:
            return []

        merged = []
        current_chunk = ""

        for chunk in chunks:
            # Nếu thêm chunk mới vẫn dưới limit → merge
            if len(current_chunk) + len(chunk) <= self.chunk_size:
                current_chunk += chunk
            else:
                # Lưu chunk hiện tại và bắt đầu chunk mới
                if current_chunk:
                    merged.append(current_chunk)

                # Nếu chunk đơn lẻ quá dài → cần split tiếp
                if len(chunk) > self.chunk_size:
                    # Split bằng separator tiếp theo
                    sep_idx = self.separators.index(separator)
                    if sep_idx < len(self.separators) - 1:
                        next_sep = self.separators[sep_idx + 1]
                        sub_chunks = self._split_by_separator(chunk, next_sep)
                        sub_merged = self._merge_chunks(sub_chunks, next_sep)
                        merged.extend(sub_merged)
                        current_chunk = ""
                    else:
                        # Đã hết separator → cắt cứng
                        for i in range(0, len(chunk), self.chunk_size):
                            merged.append(chunk[i:i + self.chunk_size])
                        current_chunk = ""
                else:
                    current_chunk = chunk

        # Add remaining chunk
        if current_chunk:
            merged.append(current_chunk)

        return merged

    def split_text(self, text: str) -> List[str]:
        """
        Split text thành chunks với semantic awareness
        """
        if not text or len(text) <= self.chunk_size:
            return [text] if text else []

        # Bắt đầu với separator đầu tiên
        chunks = self._split_by_separator(text, self.separators[0])
        result = self._merge_chunks(chunks, self.separators[0])

        # Filter out chunks quá nhỏ
        result = [c for c in result if len(c.strip()) >= self.min_chunk_size]

        # Add overlap
        if self.chunk_overlap > 0 and len(result) > 1:
            result = self._add_overlap(result)

        return result

    def _add_overlap(self, chunks: List[str]) -> List[str]:
        """Thêm overlap giữa các chunks"""
        if len(chunks) <= 1:
            return chunks

        result = [chunks[0]]

        for i in range(1, len(chunks)):
            prev_chunk = chunks[i - 1]
            curr_chunk = chunks[i]

            # Lấy phần cuối của chunk trước làm overlap
            overlap_text = prev_chunk[-self.chunk_overlap:] if len(prev_chunk) > self.chunk_overlap else prev_chunk

            # Tìm điểm cắt tốt (đầu câu)
            sentence_start = overlap_text.rfind('. ')
            if sentence_start != -1:
                overlap_text = overlap_text[sentence_start + 2:]

            # Thêm overlap vào đầu chunk hiện tại
            result.append(overlap_text + curr_chunk)

        return result

    def split_documents(self, documents: List[Document]) -> List[Document]:
        """
        Split list of documents
        """
        result = []

        for doc in documents:
            # Nếu là table → không split
            if doc.metadata.get("type") == "table" or self._is_table_content(doc.page_content):
                # Giữ nguyên table, chỉ split nếu quá dài
                if len(doc.page_content) > self.chunk_size * 2:
                    # Split table theo rows
                    rows = doc.page_content.split('\n')
                    current_chunk = ""
                    chunk_idx = 0

                    for row in rows:
                        if len(current_chunk) + len(row) + 1 <= self.chunk_size:
                            current_chunk += row + "\n"
                        else:
                            if current_chunk:
                                result.append(Document(
                                    page_content=current_chunk.strip(),
                                    metadata={
                                        **doc.metadata,
                                        "chunk_index": chunk_idx
                                    }
                                ))
                                chunk_idx += 1
                            current_chunk = row + "\n"

                    if current_chunk:
                        result.append(Document(
                            page_content=current_chunk.strip(),
                            metadata={
                                **doc.metadata,
                                "chunk_index": chunk_idx
                            }
                        ))
                else:
                    result.append(doc)
            else:
                # Split text content
                chunks = self.split_text(doc.page_content)

                for idx, chunk in enumerate(chunks):
                    result.append(Document(
                        page_content=chunk.strip(),
                        metadata={
                            **doc.metadata,
                            "chunk_index": idx,
                            "total_chunks": len(chunks)
                        }
                    ))

        return result


class QAOptimizedSplitter:
    """
    Splitter tối ưu cho Q&A chatbot
    - Giữ context đầy đủ cho mỗi chunk
    - Thêm context từ heading/section vào mỗi chunk
    """

    def __init__(self, chunk_size: int = 600, chunk_overlap: int = 50):
        self.base_splitter = SemanticTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            min_chunk_size=50
        )

    def split_documents(self, documents: List[Document]) -> List[Document]:
        """Split với context preservation"""
        result = []

        for doc in documents:
            # Extract section title nếu có
            section = doc.metadata.get("section", "")
            category = doc.metadata.get("category", "general")

            # Split document
            chunks = self.base_splitter.split_documents([doc])

            for chunk in chunks:
                # Thêm context vào đầu chunk nếu cần
                content = chunk.page_content

                # Nếu chunk không bắt đầu bằng section title → thêm vào
                if section and not content.startswith(section):
                    content = f"[{section}] {content}"

                # Update chunk
                chunk.page_content = content
                chunk.metadata["category"] = category

                result.append(chunk)

        return result
