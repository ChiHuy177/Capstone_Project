from pydantic import BaseModel
from typing import List

class ProcessPdfResponse(BaseModel):
    success: bool
    message: str
    document_id: str
    num_chunks: int

class SearchResponse(BaseModel):
    results: List[dict]