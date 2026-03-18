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
    
    async def process_pdf(self, file: UploadFile, year: int = 2026, uploaded_by: str = "admin") -> dict:
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
    
    def search_documents(self, query: str, top_k: int = 5, year: int = None) -> dict:
        """
        Tìm kiếm documents với Hybrid Search (Semantic + Keyword)
        """
        print(f"\n[SEARCH] Query: '{query}', top_k: {top_k}, year: {year}")

        # Build filter
        filter_dict = {}
        if year is not None:
            filter_dict["academic_year"] = year
        else:
            filter_dict["is_active"] = True

        # 1. Semantic Search
        try:
            semantic_results = self.vectorstore.similarity_search_with_score(
                query,
                k=top_k * 2,  # Lấy nhiều hơn để merge
                filter=filter_dict
            )
            print(f"[SEARCH] Semantic: found {len(semantic_results)} results")
        except Exception as e:
            print(f"[SEARCH] Semantic error: {e}")
            semantic_results = []

        # 2. Keyword Search (SQL)
        keyword_results = self._keyword_search(query, year, top_k * 2)
        print(f"[SEARCH] Keyword: found {len(keyword_results)} results")

        # 3. Merge và rerank
        merged_results = self._merge_and_rerank(
            semantic_results,
            keyword_results,
            query,
            top_k
        )
        print(f"[SEARCH] Merged: {len(merged_results)} results")

        formatted_results = [
            {
                "content": doc.page_content,
                "metadata": doc.metadata,
                "score": float(score)
            }
            for doc, score in merged_results
        ]

        return {"results": formatted_results}

    def _keyword_search(self, query: str, year: int = None, limit: int = 10):
        """Keyword search trong PostgreSQL"""
        from sqlalchemy import text
        from langchain_core.documents import Document

        # Extract keywords từ query
        import re
        words = re.findall(r'\b\w+\b', query.lower())
        stopwords = {'là', 'và', 'có', 'được', 'trong', 'cho', 'với', 'này', 'đó',
                     'những', 'các', 'một', 'để', 'khi', 'từ', 'về', 'theo', 'như',
                     'tôi', 'bạn', 'ở', 'thì', 'thế', 'nào', 'gì', 'sao'}
        keywords = [w for w in words if w not in stopwords and len(w) > 1]

        if not keywords:
            return []

        try:
            from app.utils.database import SessionLocal
            db = SessionLocal()

            # Build search conditions
            conditions = " OR ".join([f"document ILIKE '%{kw}%'" for kw in keywords])

            year_filter = ""
            if year:
                year_filter = f"AND (cmetadata->>'academic_year')::int = {year}"
            else:
                year_filter = "AND (cmetadata->>'is_active')::boolean = true"

            sql = f"""
                SELECT document, cmetadata,
                       (SELECT COUNT(*) FROM unnest(ARRAY[{','.join([f"'{kw}'" for kw in keywords])}]) AS kw
                        WHERE document ILIKE '%' || kw || '%') as match_count
                FROM langchain_pg_embedding
                WHERE ({conditions}) {year_filter}
                ORDER BY match_count DESC
                LIMIT {limit}
            """

            result = db.execute(text(sql))
            rows = result.fetchall()
            db.close()

            results = []
            for row in rows:
                doc = Document(page_content=row[0], metadata=row[1] or {})
                # Score: 0 = best (để consistent với similarity score)
                score = 1 - (row[2] / len(keywords)) if keywords else 1
                results.append((doc, score))

            return results
        except Exception as e:
            print(f"[SEARCH] Keyword search error: {e}")
            return []

    def _merge_and_rerank(self, semantic_results, keyword_results, query, top_k):
        """Merge semantic và keyword results, rerank"""
        # Create a map của results
        results_map = {}

        # Add semantic results
        for doc, score in semantic_results:
            doc_id = hash(doc.page_content[:200])
            if doc_id not in results_map:
                results_map[doc_id] = {
                    'doc': doc,
                    'semantic_score': 1 - score,  # Convert distance to similarity
                    'keyword_score': 0
                }
            else:
                results_map[doc_id]['semantic_score'] = max(
                    results_map[doc_id]['semantic_score'],
                    1 - score
                )

        # Add keyword results
        for doc, score in keyword_results:
            doc_id = hash(doc.page_content[:200])
            if doc_id not in results_map:
                results_map[doc_id] = {
                    'doc': doc,
                    'semantic_score': 0,
                    'keyword_score': 1 - score
                }
            else:
                results_map[doc_id]['keyword_score'] = max(
                    results_map[doc_id]['keyword_score'],
                    1 - score
                )

        # Calculate final score: weighted combination
        # Keyword match quan trọng hơn cho tiếng Việt
        SEMANTIC_WEIGHT = 0.4
        KEYWORD_WEIGHT = 0.6

        final_results = []
        for doc_id, data in results_map.items():
            final_score = (
                data['semantic_score'] * SEMANTIC_WEIGHT +
                data['keyword_score'] * KEYWORD_WEIGHT
            )
            # Convert back to distance format (lower = better)
            final_results.append((data['doc'], 1 - final_score))

        # Sort by score (ascending, vì score thấp = tốt hơn)
        final_results.sort(key=lambda x: x[1])

        # Debug top result
        if final_results:
            print(f"[SEARCH] Top result preview: {final_results[0][0].page_content[:100]}...")

        return final_results[:top_k]

# Tạo instance dùng chung
pdf_service = PdfService()