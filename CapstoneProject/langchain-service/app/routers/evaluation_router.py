"""
API Router cho ROUGE Evaluation
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
from datetime import datetime
import logging

from app.models.evaluation_schemas import (
    SingleEvaluationRequest,
    SingleEvaluationResponse,
    BatchEvaluationRequest,
    BatchEvaluationResponse,
    EvaluationPair,
    RAGEvaluationRequest,
    RAGEvaluationResponse
)
from app.services.rouge_evaluation_service import rouge_evaluation_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/evaluation", tags=["ROUGE Evaluation"])


@router.post("/rouge/single", response_model=SingleEvaluationResponse)
async def evaluate_single(request: SingleEvaluationRequest):
    """
    Đánh giá ROUGE cho một cặp generated/reference answer

    - **generated_answer**: Câu trả lời từ RAG system
    - **reference_answer**: Câu trả lời chuẩn (ground truth)

    Returns ROUGE-1, ROUGE-2, ROUGE-L scores với precision, recall, F1
    """
    try:
        result = rouge_evaluation_service.evaluate_single(
            generated=request.generated_answer,
            reference=request.reference_answer
        )
        return result
    except Exception as e:
        logger.error(f"Error in single evaluation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rouge/batch", response_model=BatchEvaluationResponse)
async def evaluate_batch(request: BatchEvaluationRequest):
    """
    Đánh giá ROUGE cho nhiều cặp Q&A

    Gửi danh sách các cặp với:
    - question: Câu hỏi
    - generated_answer: Câu trả lời từ RAG
    - reference_answer: Câu trả lời chuẩn

    Returns scores cho từng cặp và average scores
    """
    if not request.pairs:
        raise HTTPException(status_code=400, detail="Pairs list cannot be empty")

    try:
        result = rouge_evaluation_service.evaluate_batch(request.pairs)
        return result
    except Exception as e:
        logger.error(f"Error in batch evaluation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rouge/rag-evaluate")
async def evaluate_rag_system(request: RAGEvaluationRequest) -> RAGEvaluationResponse:
    """
    Đánh giá RAG system end-to-end

    Tự động:
    1. Query RAG system với câu hỏi
    2. So sánh câu trả lời với expected answer
    3. Tính ROUGE scores

    Test cases format:
    ```json
    {
        "test_cases": [
            {"question": "...", "expected_answer": "..."}
        ]
    }
    ```
    """
    from app.services.search_service import advanced_search_service

    if not request.test_cases:
        raise HTTPException(status_code=400, detail="Test cases cannot be empty")

    start_time = datetime.now()
    results = []
    total_retrieval_score = 0.0

    pairs_for_rouge = []

    for test_case in request.test_cases:
        question = test_case.get("question", "")
        expected = test_case.get("expected_answer", "")

        if not question or not expected:
            continue

        try:
            # Query RAG
            search_result = advanced_search_service.get_context_for_chat(
                query=question,
                top_k=request.top_k,
                year=request.year
            )

            context = search_result.get("context", "")
            sources = search_result.get("sources", [])

            # Lấy average retrieval score
            if sources:
                avg_score = sum(s.get("score", 0) for s in sources) / len(sources)
                total_retrieval_score += avg_score

            # Dùng context làm generated answer để so sánh
            pairs_for_rouge.append(EvaluationPair(
                question=question,
                generated_answer=context,
                reference_answer=expected
            ))

            results.append({
                "question": question,
                "expected_answer": expected,
                "retrieved_context": context[:500] + "..." if len(context) > 500 else context,
                "num_sources": len(sources),
                "sources": sources[:3]  # Top 3 sources
            })

        except Exception as e:
            logger.error(f"Error querying RAG for '{question}': {e}")
            results.append({
                "question": question,
                "expected_answer": expected,
                "error": str(e)
            })

    # Tính ROUGE scores
    rouge_results = rouge_evaluation_service.evaluate_batch(pairs_for_rouge)

    # Merge ROUGE scores vào results
    for i, result in enumerate(results):
        if i < len(rouge_results.results):
            rouge_item = rouge_results.results[i]
            result["rouge_scores"] = {
                "rouge1_f1": rouge_item.scores.rouge1_fmeasure,
                "rouge2_f1": rouge_item.scores.rouge2_fmeasure,
                "rougeL_f1": rouge_item.scores.rougeL_fmeasure
            }

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()

    n = len(request.test_cases)

    return RAGEvaluationResponse(
        total_test_cases=n,
        results=results,
        average_rouge_scores=rouge_results.average_scores,
        retrieval_stats={
            "avg_retrieval_score": round(total_retrieval_score / n, 4) if n > 0 else 0
        },
        evaluation_time=f"{duration:.2f}s"
    )


@router.get("/rouge/history")
async def get_evaluation_history():
    """
    Lấy lịch sử các lần evaluation

    Returns danh sách các evaluation gần đây với timestamp và scores
    """
    return {
        "history": rouge_evaluation_service.get_evaluation_history(),
        "total_evaluations": len(rouge_evaluation_service.evaluation_history)
    }


@router.post("/rouge/interpret")
async def interpret_scores(request: SingleEvaluationRequest):
    """
    Đánh giá và giải thích ý nghĩa ROUGE scores

    Returns scores kèm giải thích bằng tiếng Việt
    """
    result = rouge_evaluation_service.evaluate_single(
        generated=request.generated_answer,
        reference=request.reference_answer
    )

    interpretation = rouge_evaluation_service.interpret_scores(result.scores)

    return {
        "scores": result.scores,
        "summary": result.summary,
        "interpretation": interpretation
    }


@router.post("/rouge/export")
async def export_evaluation(request: BatchEvaluationRequest):
    """
    Đánh giá batch và export kết quả ra JSON file

    File sẽ được lưu tại ./evaluation_results/
    """
    if not request.pairs:
        raise HTTPException(status_code=400, detail="Pairs list cannot be empty")

    result = rouge_evaluation_service.evaluate_batch(request.pairs)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filepath = f"./evaluation_results/rouge_evaluation_{timestamp}.json"

    exported_path = rouge_evaluation_service.export_results_to_json(result, filepath)

    return {
        "message": "Evaluation completed and exported",
        "filepath": exported_path,
        "summary": result.average_scores
    }


@router.get("/health")
async def health_check():
    """Health check cho evaluation service"""
    return {
        "status": "ok",
        "service": "ROUGE Evaluation Service",
        "metrics_available": ["ROUGE-1", "ROUGE-2", "ROUGE-L"]
    }
