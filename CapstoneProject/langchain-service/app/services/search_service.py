"""
Advanced Search Service - Tìm kiếm thông minh hơn
"""
from typing import List, Dict, Optional, Tuple
from langchain_core.documents import Document
from langchain_ollama import OllamaEmbeddings
from langchain_postgres import PGVector
from sqlalchemy import text
from app.config import settings
from app.utils.database import SessionLocal
from app.utils.search_utils import (
    normalize_vietnamese,
    expand_query,
    detect_intent,
    extract_keywords,
    rerank_results,
    format_context_for_llm
)
import logging

logger = logging.getLogger(__name__)


class AdvancedSearchService:
    """
    Advanced search với:
    - Query expansion
    - Hybrid search (semantic + keyword)
    - Intent detection
    - Reranking
    """

    def __init__(self):
        print("Khởi tạo Advanced Search Service...")

        self.embeddings = OllamaEmbeddings(
            model=settings.OLLAMA_MODEL
        )

        self.vectorstore = PGVector(
            embeddings=self.embeddings,
            collection_name=settings.COLLECTION_NAME,
            connection=settings.DATABASE_URL,
            use_jsonb=True,
        )

        print("Advanced Search Service sẵn sàng!")

    def search(
        self,
        query: str,
        top_k: int = 5,
        year: Optional[int] = None,
        use_rerank: bool = True,
        use_expansion: bool = True
    ) -> Dict:
        """
        Advanced search với nhiều cải tiến

        Args:
            query: Câu hỏi
            top_k: Số kết quả trả về
            year: Filter theo năm
            use_rerank: Có rerank không
            use_expansion: Có expand query không

        Returns:
            Dict với results và metadata
        """
        # 1. Normalize query
        normalized_query = normalize_vietnamese(query)
        logger.info(f"Search query: {normalized_query}")

        # 2. Detect intent
        intents = detect_intent(query)
        logger.info(f"Detected intents: {intents}")

        # 3. Extract keywords
        keywords = extract_keywords(query)
        logger.info(f"Keywords: {keywords}")

        # 4. Build filter
        filter_dict = {}
        if year is not None:
            filter_dict["academic_year"] = year
        else:
            filter_dict["is_active"] = True

        # 5. Expand query và search
        all_results = []

        if use_expansion:
            expanded_queries = expand_query(query)
            logger.info(f"Expanded queries: {expanded_queries}")

            # Search với mỗi expanded query
            for exp_query in expanded_queries:
                try:
                    results = self.vectorstore.similarity_search_with_score(
                        exp_query,
                        k=top_k,
                        filter=filter_dict
                    )
                    all_results.extend(results)
                except Exception as e:
                    logger.warning(f"Error searching with '{exp_query}': {e}")
        else:
            # Search với original query
            all_results = self.vectorstore.similarity_search_with_score(
                query,
                k=top_k * 2,  # Lấy nhiều hơn để rerank
                filter=filter_dict
            )

        # 6. Deduplicate results
        seen_ids = set()
        unique_results = []
        for doc, score in all_results:
            doc_id = hash(doc.page_content[:200])
            if doc_id not in seen_ids:
                seen_ids.add(doc_id)
                unique_results.append((doc, score))

        # 7. Rerank
        if use_rerank and unique_results:
            unique_results = rerank_results(unique_results, query, intents)
            logger.info("Results reranked")

        # 8. Take top_k
        final_results = unique_results[:top_k]

        # 9. Format response
        formatted_results = []
        for doc, score in final_results:
            formatted_results.append({
                "content": doc.page_content,
                "metadata": {
                    **doc.metadata,
                    "relevance_score": round(score, 4)
                },
                "score": float(score)
            })

        return {
            "results": formatted_results,
            "query_info": {
                "original": query,
                "normalized": normalized_query,
                "intents": intents,
                "keywords": keywords,
                "expanded_queries": expand_query(query) if use_expansion else [query]
            }
        }

    def search_hybrid(
        self,
        query: str,
        top_k: int = 5,
        year: Optional[int] = None,
        semantic_weight: float = 0.7,
        keyword_weight: float = 0.3
    ) -> Dict:
        """
        Hybrid search: Semantic + Keyword

        Args:
            query: Câu hỏi
            top_k: Số kết quả
            year: Filter năm
            semantic_weight: Trọng số cho semantic search
            keyword_weight: Trọng số cho keyword search
        """
        # 1. Semantic search
        filter_dict = {"is_active": True}
        if year:
            filter_dict["academic_year"] = year

        semantic_results = self.vectorstore.similarity_search_with_score(
            query,
            k=top_k * 2,
            filter=filter_dict
        )

        # 2. Keyword search (dùng SQL trực tiếp)
        keywords = extract_keywords(query)
        keyword_results = self._keyword_search(keywords, year, top_k * 2)

        # 3. Merge và score
        merged = self._merge_hybrid_results(
            semantic_results,
            keyword_results,
            semantic_weight,
            keyword_weight
        )

        # 4. Take top_k
        final_results = merged[:top_k]

        # 5. Format
        formatted_results = []
        for doc, score in final_results:
            formatted_results.append({
                "content": doc.page_content,
                "metadata": {
                    **doc.metadata,
                    "relevance_score": round(score, 4)
                },
                "score": float(score)
            })

        return {
            "results": formatted_results,
            "search_type": "hybrid",
            "weights": {
                "semantic": semantic_weight,
                "keyword": keyword_weight
            }
        }

    def _keyword_search(
        self,
        keywords: List[str],
        year: Optional[int],
        limit: int
    ) -> List[Tuple[Document, float]]:
        """
        Keyword search trong PostgreSQL
        """
        if not keywords:
            return []

        db = SessionLocal()
        try:
            # Build search condition
            search_conditions = " OR ".join([
                f"document ILIKE '%{kw}%'" for kw in keywords
            ])

            year_condition = ""
            if year:
                year_condition = f"AND (cmetadata->>'academic_year')::int = {year}"
            else:
                year_condition = "AND (cmetadata->>'is_active')::boolean = true"

            sql = f"""
                SELECT document, cmetadata,
                       (SELECT COUNT(*) FROM unnest(ARRAY[{','.join([f"'{kw}'" for kw in keywords])}]) AS kw
                        WHERE document ILIKE '%' || kw || '%') as match_count
                FROM langchain_pg_embedding
                WHERE ({search_conditions}) {year_condition}
                ORDER BY match_count DESC
                LIMIT {limit}
            """

            result = db.execute(text(sql))
            rows = result.fetchall()

            keyword_results = []
            for row in rows:
                doc = Document(
                    page_content=row[0],
                    metadata=row[1] if row[1] else {}
                )
                # Score dựa trên số keyword match
                score = row[2] / len(keywords) if keywords else 0
                keyword_results.append((doc, score))

            return keyword_results

        except Exception as e:
            logger.error(f"Keyword search error: {e}")
            return []
        finally:
            db.close()

    def _merge_hybrid_results(
        self,
        semantic_results: List[Tuple],
        keyword_results: List[Tuple],
        semantic_weight: float,
        keyword_weight: float
    ) -> List[Tuple[Document, float]]:
        """
        Merge semantic và keyword results với weighted scoring
        """
        # Create score maps
        semantic_scores = {}
        for doc, score in semantic_results:
            doc_id = hash(doc.page_content[:200])
            # Convert distance to similarity
            semantic_scores[doc_id] = (doc, 1 - score)

        keyword_scores = {}
        for doc, score in keyword_results:
            doc_id = hash(doc.page_content[:200])
            keyword_scores[doc_id] = (doc, score)

        # Merge
        all_doc_ids = set(semantic_scores.keys()) | set(keyword_scores.keys())
        merged = []

        for doc_id in all_doc_ids:
            # Get scores (default 0 if not found)
            sem_doc, sem_score = semantic_scores.get(doc_id, (None, 0))
            kw_doc, kw_score = keyword_scores.get(doc_id, (None, 0))

            # Use whichever doc we have
            doc = sem_doc or kw_doc

            # Weighted score
            final_score = (sem_score * semantic_weight) + (kw_score * keyword_weight)

            merged.append((doc, final_score))

        # Sort by score descending
        merged.sort(key=lambda x: x[1], reverse=True)

        return merged

    def get_context_for_chat(
        self,
        query: str,
        top_k: int = 5,
        year: Optional[int] = None,
        max_tokens: int = 2000
    ) -> Dict:
        """
        Get formatted context cho chatbot

        Returns context string đã được format sẵn cho LLM
        """
        # Search
        search_result = self.search(
            query=query,
            top_k=top_k,
            year=year,
            use_rerank=True,
            use_expansion=True
        )

        # Convert back to tuples for formatting
        results_tuples = [
            (Document(
                page_content=r["content"],
                metadata=r["metadata"]
            ), r["score"])
            for r in search_result["results"]
        ]

        # Format context
        context = format_context_for_llm(results_tuples, max_tokens)

        return {
            "context": context,
            "sources": [
                {
                    "file": r["metadata"].get("source_file", "unknown"),
                    "page": r["metadata"].get("page", "?"),
                    "score": r["score"]
                }
                for r in search_result["results"]
            ],
            "query_info": search_result.get("query_info", {})
        }


# Singleton instance
advanced_search_service = AdvancedSearchService()
