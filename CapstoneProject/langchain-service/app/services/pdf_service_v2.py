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

            # Extract PDF với semantic awareness
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

            # Split thành chunks với semantic splitter
            print("Đang chia thành semantic chunks...")
            if use_qa_mode:
                chunks = self.qa_splitter.split_documents(pages)
            else:
                chunks = self.text_splitter.split_documents(pages)
            print(f"Đã tạo {len(chunks)} chunks")

            # Log sample chunks để debug
            print("\n=== Sample Chunks ===")
            for i, chunk in enumerate(chunks[:3]):
                print(f"\n--- Chunk {i + 1} ---")
                print(f"Type: {chunk.metadata.get('type', 'text')}")
                print(f"Category: {chunk.metadata.get('category', 'N/A')}")
                print(f"Content preview: {chunk.page_content[:200]}...")
                print(f"Metadata: {chunk.metadata}")

            # Thêm metadata vào chunks
            for i, chunk in enumerate(chunks):
                chunk.metadata.update({
                    "document_id": str(document_id),
                    "chunk_index": chunk.metadata.get("chunk_index", i),
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

            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            raise e
        finally:
            db.close()

    def search_documents(self, query: str, top_k: int = 5, year: int = None) -> dict:
        """
        Tìm kiếm documents với better ranking
        """
        # Build filter
        filter_dict = {}
        if year is not None:
            filter_dict["academic_year"] = year
        else:
            filter_dict["is_active"] = True

        # Search
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

        # Format results với additional info
        formatted_results = []
        for doc, score in results:
            formatted_results.append({
                "content": doc.page_content,
                "metadata": {
                    **doc.metadata,
                    "relevance_score": round(1 - score, 4)  # Convert distance to similarity
                },
                "score": float(score)
            })

        return {"results": formatted_results}


# Tạo instance
pdf_service_v2 = PdfServiceV2()
