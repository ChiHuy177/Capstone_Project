"""
Pydantic schemas cho ROUGE Evaluation
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime


class RougeScores(BaseModel):
    """ROUGE scores cho một cặp text"""
    rouge1_precision: float = Field(..., description="ROUGE-1 Precision")
    rouge1_recall: float = Field(..., description="ROUGE-1 Recall")
    rouge1_fmeasure: float = Field(..., description="ROUGE-1 F1-Score")

    rouge2_precision: float = Field(..., description="ROUGE-2 Precision")
    rouge2_recall: float = Field(..., description="ROUGE-2 Recall")
    rouge2_fmeasure: float = Field(..., description="ROUGE-2 F1-Score")

    rougeL_precision: float = Field(..., description="ROUGE-L Precision")
    rougeL_recall: float = Field(..., description="ROUGE-L Recall")
    rougeL_fmeasure: float = Field(..., description="ROUGE-L F1-Score")


class EvaluationPair(BaseModel):
    """Một cặp câu hỏi-trả lời để đánh giá"""
    question: str = Field(..., description="Câu hỏi")
    generated_answer: str = Field(..., description="Câu trả lời từ RAG system")
    reference_answer: str = Field(..., description="Câu trả lời chuẩn (ground truth)")

    class Config:
        json_schema_extra = {
            "example": {
                "question": "Học phí ngành CNTT là bao nhiêu?",
                "generated_answer": "Học phí ngành Công nghệ thông tin là 20 triệu đồng/năm",
                "reference_answer": "Học phí ngành CNTT là 20.000.000 VNĐ mỗi năm học"
            }
        }


class SingleEvaluationRequest(BaseModel):
    """Request đánh giá một cặp"""
    generated_answer: str = Field(..., description="Câu trả lời từ RAG")
    reference_answer: str = Field(..., description="Câu trả lời chuẩn")

    class Config:
        json_schema_extra = {
            "example": {
                "generated_answer": "Học phí ngành CNTT là 20 triệu đồng/năm",
                "reference_answer": "Học phí ngành Công nghệ thông tin là 20.000.000 VNĐ mỗi năm học"
            }
        }


class SingleEvaluationResponse(BaseModel):
    """Response đánh giá một cặp"""
    scores: RougeScores
    summary: Dict[str, float] = Field(..., description="Tóm tắt F1-scores")


class BatchEvaluationRequest(BaseModel):
    """Request đánh giá nhiều cặp"""
    pairs: List[EvaluationPair] = Field(..., description="Danh sách các cặp cần đánh giá")

    class Config:
        json_schema_extra = {
            "example": {
                "pairs": [
                    {
                        "question": "Học phí ngành CNTT?",
                        "generated_answer": "20 triệu/năm",
                        "reference_answer": "20.000.000 VNĐ/năm"
                    },
                    {
                        "question": "Điểm chuẩn ngành Kinh tế?",
                        "generated_answer": "25 điểm",
                        "reference_answer": "Điểm chuẩn là 25.0"
                    }
                ]
            }
        }


class EvaluationResult(BaseModel):
    """Kết quả đánh giá cho một cặp"""
    question: str
    generated_answer: str
    reference_answer: str
    scores: RougeScores


class BatchEvaluationResponse(BaseModel):
    """Response đánh giá batch"""
    total_pairs: int
    results: List[EvaluationResult]
    average_scores: Dict[str, float] = Field(..., description="Điểm trung bình các metrics")
    evaluation_time: str


class RAGEvaluationRequest(BaseModel):
    """Request đánh giá RAG trực tiếp - tự động query và so sánh"""
    test_cases: List[Dict[str, str]] = Field(
        ...,
        description="List các test case với 'question' và 'expected_answer'"
    )
    year: Optional[int] = Field(None, description="Filter theo năm học")
    top_k: int = Field(5, description="Số chunks để retrieve")

    class Config:
        json_schema_extra = {
            "example": {
                "test_cases": [
                    {
                        "question": "Học phí ngành CNTT là bao nhiêu?",
                        "expected_answer": "Học phí ngành CNTT là 20 triệu đồng/năm"
                    }
                ],
                "year": 2026,
                "top_k": 5
            }
        }


class RAGEvaluationResponse(BaseModel):
    """Response đánh giá RAG"""
    total_test_cases: int
    results: List[Dict]
    average_rouge_scores: Dict[str, float]
    retrieval_stats: Dict[str, float]
    evaluation_time: str
