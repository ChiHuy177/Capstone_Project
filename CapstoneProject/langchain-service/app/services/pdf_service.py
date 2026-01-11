import os
from fastapi import UploadFile
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_postgres import PGVector
from sqlalchemy.orm import Session
from app.config import settings
from app.utils.pdf_extractor import extract_pdf_with_pdfplumber
from app.utils.database import Document, SessionLocal
import uuid
from datetime import datetime

class PdfService:
    """Service để xử lý PDF operations"""
    
    def __init__(self):
        """Khởi tạo embeddings và text splitter"""
        print("Đang khởi tạo Ollama embeddings...")
        self.embeddings = OllamaEmbeddings(
            model=settings.OLLAMA_MODEL
        )
        print("Ollama embeddings sẵn sàng!")
        
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            length_function=len,
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
    
    async def process_pdf(self, file: UploadFile, uploaded_by: str = "admin") -> dict:
        """
        Xử lý file PDF
        
        Args:
            file: File PDF upload
            uploaded_by: User upload
            
        Returns:
            Dict với thông tin xử lý
        """
        os.makedirs("./temp", exist_ok=True)
        temp_file_path = f"./temp/{file.filename}"
        db = SessionLocal()
        document_id = uuid.uuid4()
        
        try:
            # Tạo document record trong DB
            db_document = Document(
                id=document_id,
                filename=f"{document_id}_{file.filename}",
                original_filename=file.filename,
                file_size=file.size if hasattr(file, 'size') else 0,
                uploaded_by=uploaded_by,
                status='processing'
            )
            db.add(db_document)
            db.commit()
            
            # Lưu file tạm
            with open(temp_file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            # Extract PDF
            print(f"Đang extract PDF với pdfplumber: {file.filename}")
            pages = extract_pdf_with_pdfplumber(temp_file_path)
            print(f"Đã extract {len(pages)} trang")
            
            # Update total_pages
            db_document.total_pages = len(pages)
            db.commit()
            
            # Split thành chunks
            print("Đang chia thành chunks...")
            chunks = self.text_splitter.split_documents(pages)
            print(f"Đã tạo {len(chunks)} chunks")
            
            # Thêm metadata vào chunks
            for i, chunk in enumerate(chunks):
                chunk.metadata.update({
                    "document_id": str(document_id),
                    "chunk_index": i,
                    "source_file": file.filename,
                    "uploaded_at": datetime.utcnow().isoformat()
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
                "message": "PDF processed successfully with PostgreSQL + pgvector",
                "document_id": str(document_id),
                "num_chunks": len(chunks)
            }
            
        except Exception as e:
            # Update status = failed
            db_document.status = 'failed'
            db_document.error_message = str(e)
            db.commit()
            
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            raise e
        finally:
            db.close()
    
    def search_documents(self, query: str, top_k: int = 5) -> dict:
        """
        Tìm kiếm documents
        
        Args:
            query: Câu query
            top_k: Số kết quả trả về
            
        Returns:
            Dict với kết quả search
        """
        # Search với score
        results = self.vectorstore.similarity_search_with_score(query, k=top_k)
        
        formatted_results = [
            {
                "content": doc.page_content,
                "metadata": doc.metadata,
                "score": float(score)
            }
            for doc, score in results
        ]
        
        return {"results": formatted_results}

# Tạo instance dùng chung
pdf_service = PdfService()