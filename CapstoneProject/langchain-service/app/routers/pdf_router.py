from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from app.models.schemas import ProcessPdfResponse, SearchResponse
from app.services.pdf_service import pdf_service

# Import v2 service (semantic chunking)
try:
    from app.services.pdf_service_v2 import pdf_service_v2
    V2_AVAILABLE = True
except ImportError:
    V2_AVAILABLE = False
    print("Warning: pdf_service_v2 not available, using v1")

# Import advanced search service
try:
    from app.services.search_service import advanced_search_service
    ADVANCED_SEARCH_AVAILABLE = True
except ImportError:
    ADVANCED_SEARCH_AVAILABLE = False
    print("Warning: advanced_search_service not available")

router = APIRouter(
    prefix="/api/pdf",
    tags=["PDF"]
)


@router.post("/process", response_model=ProcessPdfResponse)
async def process_pdf(
    file: UploadFile = File(...),
    year: int = 2026,
    use_semantic: bool = Query(True, description="Sử dụng semantic chunking (v2)")
):
    """
    Process PDF file

    - use_semantic=True: Sử dụng semantic chunking (recommended)
    - use_semantic=False: Sử dụng basic chunking (legacy)
    """
    try:
        if use_semantic and V2_AVAILABLE:
            result = await pdf_service_v2.process_pdf(file, year=year, use_qa_mode=True)
        else:
            result = await pdf_service.process_pdf(file, year=year)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search", response_model=SearchResponse)
async def search_documents(
    query: str,
    top_k: int = 5,
    year: int = None,
    use_semantic: bool = Query(True, description="Sử dụng semantic search (v2)")
):
    """
    Search documents

    - use_semantic=True: Sử dụng v2 service
    - use_semantic=False: Sử dụng v1 service
    """
    try:
        if use_semantic and V2_AVAILABLE:
            result = pdf_service_v2.search_documents(query, top_k, year)
        else:
            result = pdf_service.search_documents(query, top_k, year)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# === V2 Endpoints (explicit) ===

@router.post("/v2/process", response_model=ProcessPdfResponse)
async def process_pdf_v2(
    file: UploadFile = File(...),
    year: int = 2026,
    qa_mode: bool = Query(True, description="Tối ưu cho Q&A chatbot")
):
    """
    Process PDF với Semantic Chunking v2

    - qa_mode=True: Tối ưu cho Q&A (giữ context, categorize content)
    - qa_mode=False: General semantic chunking
    """
    if not V2_AVAILABLE:
        raise HTTPException(status_code=501, detail="V2 service not available")

    try:
        result = await pdf_service_v2.process_pdf(file, year=year, use_qa_mode=qa_mode)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/v2/search", response_model=SearchResponse)
async def search_documents_v2(
    query: str,
    top_k: int = 5,
    year: int = None
):
    """Search với V2 service"""
    if not V2_AVAILABLE:
        raise HTTPException(status_code=501, detail="V2 service not available")

    try:
        result = pdf_service_v2.search_documents(query, top_k, year)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# === Advanced Search Endpoints ===

@router.post("/advanced/search")
async def advanced_search(
    query: str,
    top_k: int = 5,
    year: int = None,
    use_rerank: bool = Query(True, description="Rerank results"),
    use_expansion: bool = Query(True, description="Expand query với synonyms")
):
    """
    Advanced Search với:
    - Query expansion (synonyms)
    - Intent detection
    - Reranking
    """
    if not ADVANCED_SEARCH_AVAILABLE:
        raise HTTPException(status_code=501, detail="Advanced search not available")

    try:
        result = advanced_search_service.search(
            query=query,
            top_k=top_k,
            year=year,
            use_rerank=use_rerank,
            use_expansion=use_expansion
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/advanced/hybrid")
async def hybrid_search(
    query: str,
    top_k: int = 5,
    year: int = None,
    semantic_weight: float = Query(0.7, ge=0, le=1, description="Weight cho semantic search"),
    keyword_weight: float = Query(0.3, ge=0, le=1, description="Weight cho keyword search")
):
    """
    Hybrid Search: Kết hợp Semantic + Keyword

    - semantic_weight: Trọng số cho semantic similarity
    - keyword_weight: Trọng số cho keyword matching
    """
    if not ADVANCED_SEARCH_AVAILABLE:
        raise HTTPException(status_code=501, detail="Advanced search not available")

    try:
        result = advanced_search_service.search_hybrid(
            query=query,
            top_k=top_k,
            year=year,
            semantic_weight=semantic_weight,
            keyword_weight=keyword_weight
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/advanced/context")
async def get_chat_context(
    query: str,
    top_k: int = 5,
    year: int = None,
    max_tokens: int = Query(2000, description="Max tokens cho context")
):
    """
    Get formatted context cho chatbot

    Returns context string đã được format sẵn cho LLM,
    loại bỏ duplicates và truncate nếu quá dài.
    """
    if not ADVANCED_SEARCH_AVAILABLE:
        raise HTTPException(status_code=501, detail="Advanced search not available")

    try:
        result = advanced_search_service.get_context_for_chat(
            query=query,
            top_k=top_k,
            year=year,
            max_tokens=max_tokens
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))