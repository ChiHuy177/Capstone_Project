"""
PDF Service v2 - Sử dụng semantic chunking
"""
import os
from fastapi import UploadFile
from langchain_ollama import OllamaEmbeddings
from langchain_postgres import PGVector
from app.config import settings
from app.utils.pdf_extractor_v2 import extract_pdf_semantic, extract_pdf_for_qa
from app.utils.semantic_splitter import SemanticTextSplitter, QAOptimizedSplitter
from app.utils.database import Document, SessionLocal
import uuid
from datetime import datetime
import re
import logging

# Thêm alias (tên phụ) cho Document của Langchain để không đụng hàng với DB Document
from langchain_core.documents import Document as LangchainDocument 

# Khởi tạo logger nếu file bạn chưa có
logger = logging.getLogger(__name__)

# ... (Giữ nguyên các import khác của bạn như file Database Document, v.v.)


class PdfServiceV2:
    """Service để xử lý PDF với semantic chunking"""

    def __init__(self):
        """Khởi tạo embeddings và splitters"""
        print("Đang khởi tạo Ollama embeddings...")
        self.embeddings = OllamaEmbeddings(
            model=settings.OLLAMA_MODEL
        )
        print("Ollama embeddings sẵn sàng!")

        # Semantic splitter thay vì RecursiveCharacterTextSplitter
        self.text_splitter = SemanticTextSplitter(
            chunk_size=800,       # Nhỏ hơn để focus hơn
            chunk_overlap=100,    # Overlap vừa đủ
            min_chunk_size=50     # Không tạo chunks quá nhỏ
        )

        # QA-optimized splitter cho chatbot
        self.qa_splitter = QAOptimizedSplitter(
            chunk_size=600,
            chunk_overlap=50
        )

        # Initialize PGVector
        print("Kết nối PostgreSQL + pgvector...")
        self.vectorstore = PGVector(
            embeddings=self.embeddings,
            collection_name=settings.COLLECTION_NAME,
            connection=settings.DATABASE_URL,
            use_jsonb=True, 
        )
        print("PostgreSQL vector store sẵn sàng!")

    async def process_pdf(
        self,
        file: UploadFile,
        year: int = 2026,
        uploaded_by: str = "admin",
        use_qa_mode: bool = True  # Mặc định dùng QA mode
    ) -> dict:
        """
        Xử lý file PDF với semantic chunking

        Args:
            file: File PDF upload
            year: Năm học
            uploaded_by: User upload
            use_qa_mode: True = tối ưu cho Q&A, False = general

        Returns:
            Dict với thông tin xử lý
        """
        os.makedirs("./temp", exist_ok=True)
        temp_file_path = f"./temp/{file.filename}"
        db = SessionLocal()
        document_id = uuid.uuid4()

        try:
            # Tạo document record
            db_document = Document(
                id=document_id,
                filename=f"{document_id}_{file.filename}",
                original_filename=file.filename,
                file_size=file.size if hasattr(file, 'size') else 0,
                uploaded_by=uploaded_by,
                status='processing',
                academic_year=year,
                is_active=(year == 2026)
            )
            db.add(db_document)
            db.commit()

            # Lưu file tạm
            with open(temp_file_path, "wb") as f:
                content = await file.read()
                f.write(content)

            # 1. Extract PDF
            print(f"Đang extract PDF: {file.filename}")
            if use_qa_mode:
                pages = extract_pdf_for_qa(temp_file_path)
                print(f"Đã extract {len(pages)} documents (QA mode)")
            else:
                pages = extract_pdf_semantic(temp_file_path)
                print(f"Đã extract {len(pages)} documents (Semantic mode)")

            # Update total_pages
            total_pages = max(doc.metadata.get("page", 1) for doc in pages) if pages else 0
            db_document.total_pages = total_pages
            db.commit()

           # --- BẮT ĐẦU: PRE-SPLITTING (CHIA KHỐI THEO CHỦ ĐỀ CÓ SẴN MARKER) ---
            print("Đang tiến hành phân loại chủ đề dựa trên Hard Markers...")
            
            # Gộp toàn bộ text từ các trang lại
            # Lưu ý: Dùng " " (khoảng trắng) để join nếu PDF của bạn bị dính chữ, tránh nối 2 từ liền nhau
            full_text = " ".join([page.page_content for page in pages])

            # 1. Tách text ngay TRƯỚC mỗi cụm (((MỤC LỤC CHI TIẾT: ...)))
            # Dùng regex lookahead (?=\(\(\() để cắt mà không làm mất marker
            raw_sections = re.split(r'(?=\(\(\(MỤC LỤC CHI TIẾT:[^)]+\)\)\))', full_text, flags=re.IGNORECASE)
            
            topic_documents = []
            current_topic = "THÔNG TIN CHUNG VỀ EIU" # Chủ đề mặc định đề phòng đoạn đầu không có marker
            
            for section_text in raw_sections:
                section_text = section_text.strip()
                if not section_text:
                    continue

                # 2. Trích xuất chính xác tên chủ đề nằm giữa (((MỤC LỤC CHI TIẾT: và )))
                topic_match = re.search(r'\(\(\(MỤC LỤC CHI TIẾT:\s*([^)]+)\)\)\)', section_text, re.IGNORECASE)
                
                if topic_match:
                    # Lấy tên chủ đề (ví dụ: "NGÀNH KINH TẾ")
                    current_topic = topic_match.group(1).strip().upper()
                    
                    # 3. Làm sạch text: Xóa bỏ cái marker (((...))) thô kệch đi để LLM đọc không bị rối
                    section_text = re.sub(r'\(\(\(MỤC LỤC CHI TIẾT:[^)]+\)\)\)\s*', '', section_text, flags=re.IGNORECASE)

                # 4. Gắn lại tiền tố [THÔNG TIN: ...] gọn gàng, chuẩn form cho Chunk
                context_prefix = f"[THÔNG TIN: {current_topic}]"
                clean_section_text = f"{context_prefix}\n{section_text.strip()}"

                # 5. Tạo Document mới cho khối chủ đề này
                doc = LangchainDocument(
                    page_content=clean_section_text,
                    metadata={"semantic_context": current_topic}
                )
                topic_documents.append(doc)
            # --- KẾT THÚC: PRE-SPLITTING ---

            # --- 2. TIẾN HÀNH CHIA CHUNK TRÊN CÁC KHỐI ĐÃ LÀM SẠCH ---
            print("Đang chia thành semantic chunks từ các khối chủ đề...")
            if use_qa_mode:
                chunks = self.qa_splitter.split_documents(topic_documents)
            else:
                chunks = self.text_splitter.split_documents(topic_documents)
            
            print(f"Đã tạo {len(chunks)} chunks an toàn không bị giao thoa!")

            # Log sample chunks để debug
            print("\n=== Sample Chunks Sau Khi Pre-splitting ===")
            for i, chunk in enumerate(chunks[:3]):
                print(f"\n--- Chunk {i + 1} ---")
                print(f"Semantic Context: {chunk.metadata.get('semantic_context')}")
                print(f"Content preview: {chunk.page_content[:200]}...")

            # 3. Thêm metadata hệ thống vào chunks
            for i, chunk in enumerate(chunks):
                chunk.metadata.update({
                    "document_id": str(document_id),
                    "chunk_index": i,
                    "source_file": file.filename,
                    "uploaded_at": datetime.utcnow().isoformat(),
                    "academic_year": year,
                    "is_active": (year == 2026)
                })

            # Lưu vào PostgreSQL vector store
            print("Đang tạo embeddings và lưu vào PostgreSQL...")
            self.vectorstore.add_documents(chunks)
            print("Hoàn thành!")

            # Update document status
            db_document.status = 'completed'
            db_document.total_chunks = len(chunks)
            db.commit()

            # Xóa file temp
            os.remove(temp_file_path)

            return {
                "success": True,
                "message": "PDF processed with semantic chunking",
                "document_id": str(document_id),
                "num_chunks": len(chunks),
                "num_pages": total_pages,
                "mode": "qa" if use_qa_mode else "semantic"
            }

        except Exception as e:
            db_document.status = 'failed'
            db_document.error_message = str(e)
            db.commit()

            logger.exception("Error processing PDF %s (year=%s, qa_mode=%s)", file.filename, year, use_qa_mode)
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            raise e
        finally:
            db.close()

    def search_documents(self, query: str, top_k: int = 5, year: int = None, target_topic: str = None) -> dict:
        """
        Tìm kiếm documents với better ranking và Context-Aware
        """
        print(f"🔍 Đang tìm kiếm cho query: '{query}'")
        
        # 1. Build filter cơ bản
        filter_dict = {}
        if year is not None:
            filter_dict["academic_year"] = year
        else:
            filter_dict["is_active"] = True

        # 2. Lọc cứng theo chủ đề (Hard-filter)
        if target_topic:
            filter_dict["semantic_context"] = target_topic
            print(f"🎯 Đã kích hoạt filter chủ đề: {target_topic}")

        # 3. Thực hiện Search
        if filter_dict:
            results = self.vectorstore.similarity_search_with_score(
                query,
                k=top_k,
                filter=filter_dict
            )
        else:
            results = self.vectorstore.similarity_search_with_score(
                query,
                k=top_k
            )

        # 4. Format kết quả và tối ưu hóa cho LLM đọc
        formatted_results = []
        for doc, score in results:
            # Convert khoảng cách (distance) sang độ tương đồng (similarity)
            relevance_score = round(1 - float(score), 4) 
            
            # Lấy ngữ cảnh ra từ metadata
            context = doc.metadata.get("semantic_context", "THÔNG TIN CHUNG")
            
            # Làm sạch nội dung: Đảm bảo không bị lặp chữ [THÔNG TIN: ...]
            clean_content = doc.page_content
            prefix = f"[THÔNG TIN: {context}]"
            
            if clean_content.startswith(prefix):
                # Cách cắt chuỗi an toàn tuyệt đối, không sợ lỗi do ký tự xuống dòng ẩn
                clean_content = clean_content[len(prefix):].strip()
                
            # Đóng gói lại nội dung theo format chuẩn hóa để LLM dễ hiểu nhất
            final_content = f"--- BẮT ĐẦU PHẦN THÔNG TIN TỪ CHỦ ĐỀ: {context} ---\n{clean_content}\n--- KẾT THÚC PHẦN THÔNG TIN ---"

            formatted_results.append({
                "content": final_content,
                "metadata": {
                    "document_id": doc.metadata.get("document_id"),
                    "source_file": doc.metadata.get("source_file"),
                    "semantic_context": context,
                    "relevance_score": relevance_score
                },
                "score": float(score)
            })

        # 5. Nhóm các kết quả theo ngữ cảnh (Context Grouping)
        # Sắp xếp ưu tiên: Tên chủ đề (A-Z) -> Độ tương đồng (Cao xuống thấp)
        formatted_results.sort(key=lambda x: (x["metadata"]["semantic_context"], -x["metadata"]["relevance_score"]))

        print(f"✅ Tìm thấy {len(formatted_results)} chunks phù hợp.")
        return {"results": formatted_results}


# Tạo instance
pdf_service_v2 = PdfServiceV2()
