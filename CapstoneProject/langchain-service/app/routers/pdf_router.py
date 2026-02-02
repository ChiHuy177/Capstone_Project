from fastapi import APIRouter, File, UploadFile, HTTPException
from app.models.schemas import ProcessPdfResponse, SearchResponse
from app.services.pdf_service import pdf_service

router = APIRouter(
    prefix="/api/pdf",
    tags=["PDF"]
)

@router.post("/process", response_model=ProcessPdfResponse)
async def process_pdf(
    file: UploadFile = File(...),
    year: int = 2026  
):
    try:
        result = await pdf_service.process_pdf(file, year=year)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search", response_model=SearchResponse)
async def search_documents(
    query: str, 
    top_k: int = 5,
    year: int = None
):
    try:
        result = pdf_service.search_documents(query, top_k, year)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))