from pydantic import BaseModel
from typing import List

class ProcessPdfResponse(BaseModel):
    success: bool
    message: str
    document_id: str
    num_chunks: int

class SearchResponse(BaseModel):
    results: List[dict]
    
class ProcessPdfRequest(BaseModel):
    year: int = 2026  
    
    class Config:
        json_schema_extra = {
            "example": {
                "year": 2026
            }
        }
        
class SearchRequestWithYear(BaseModel):
    """Search request có thêm year filter"""
    query: str
    top_k: int = 5
    year: int | None = None 
    
    class Config:
        json_schema_extra = {
            "example": {
                "query": "học phí CNTT",
                "top_k": 5,
                "year": 2026
            }
        }