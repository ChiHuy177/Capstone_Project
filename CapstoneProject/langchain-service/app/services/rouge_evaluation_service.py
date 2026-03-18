"""
ROUGE Evaluation Service cho RAG System
"""
from typing import List, Dict, Optional, Tuple
from rouge_score import rouge_scorer
from datetime import datetime
import logging
import json
import os

from app.models.evaluation_schemas import (
    RougeScores,
    EvaluationPair,
    EvaluationResult,
    SingleEvaluationResponse,
    BatchEvaluationResponse
)

logger = logging.getLogger(__name__)


class RougeEvaluationService:
    """
    Service đánh giá chất lượng RAG bằng ROUGE metrics

    ROUGE metrics:
    - ROUGE-1: Unigram overlap (từ đơn)
    - ROUGE-2: Bigram overlap (cặp từ liên tiếp)
    - ROUGE-L: Longest Common Subsequence
    """

    def __init__(self):
        """Khởi tạo ROUGE scorer"""
        self.scorer = rouge_scorer.RougeScorer(
            ['rouge1', 'rouge2', 'rougeL'],
            use_stemmer=False  # Không dùng stemmer cho tiếng Việt
        )
        self.evaluation_history: List[Dict] = []
        logger.info("ROUGE Evaluation Service initialized")

    def preprocess_text(self, text: str) -> str:
        """
        Tiền xử lý text trước khi tính ROUGE

        Args:
            text: Text cần xử lý

        Returns:
            Text đã được chuẩn hóa
        """
        if not text:
            return ""

        # Lowercase
        text = text.lower()

        # Chuẩn hóa khoảng trắng
        text = ' '.join(text.split())

        # Loại bỏ một số ký tự đặc biệt nhưng giữ dấu tiếng Việt
        import re
        text = re.sub(r'[^\w\s\u00C0-\u1EF9]', ' ', text)
        text = ' '.join(text.split())

        return text

    def calculate_rouge(
        self,
        generated: str,
        reference: str,
        preprocess: bool = True
    ) -> RougeScores:
        """
        Tính ROUGE scores cho một cặp generated/reference

        Args:
            generated: Câu trả lời từ RAG system
            reference: Câu trả lời chuẩn (ground truth)
            preprocess: Có tiền xử lý text không

        Returns:
            RougeScores object
        """
        if preprocess:
            generated = self.preprocess_text(generated)
            reference = self.preprocess_text(reference)

        # Handle empty strings
        if not generated or not reference:
            return RougeScores(
                rouge1_precision=0.0, rouge1_recall=0.0, rouge1_fmeasure=0.0,
                rouge2_precision=0.0, rouge2_recall=0.0, rouge2_fmeasure=0.0,
                rougeL_precision=0.0, rougeL_recall=0.0, rougeL_fmeasure=0.0
            )

        # Tính scores
        scores = self.scorer.score(reference, generated)

        return RougeScores(
            rouge1_precision=round(scores['rouge1'].precision, 4),
            rouge1_recall=round(scores['rouge1'].recall, 4),
            rouge1_fmeasure=round(scores['rouge1'].fmeasure, 4),

            rouge2_precision=round(scores['rouge2'].precision, 4),
            rouge2_recall=round(scores['rouge2'].recall, 4),
            rouge2_fmeasure=round(scores['rouge2'].fmeasure, 4),

            rougeL_precision=round(scores['rougeL'].precision, 4),
            rougeL_recall=round(scores['rougeL'].recall, 4),
            rougeL_fmeasure=round(scores['rougeL'].fmeasure, 4)
        )

    def evaluate_single(
        self,
        generated: str,
        reference: str
    ) -> SingleEvaluationResponse:
        """
        Đánh giá một cặp câu trả lời

        Args:
            generated: Câu trả lời từ RAG
            reference: Câu trả lời chuẩn

        Returns:
            SingleEvaluationResponse
        """
        scores = self.calculate_rouge(generated, reference)

        summary = {
            "rouge1_f1": scores.rouge1_fmeasure,
            "rouge2_f1": scores.rouge2_fmeasure,
            "rougeL_f1": scores.rougeL_fmeasure,
            "average_f1": round(
                (scores.rouge1_fmeasure + scores.rouge2_fmeasure + scores.rougeL_fmeasure) / 3,
                4
            )
        }

        return SingleEvaluationResponse(scores=scores, summary=summary)

    def evaluate_batch(
        self,
        pairs: List[EvaluationPair]
    ) -> BatchEvaluationResponse:
        """
        Đánh giá nhiều cặp câu trả lời

        Args:
            pairs: Danh sách các cặp cần đánh giá

        Returns:
            BatchEvaluationResponse
        """
        start_time = datetime.now()
        results: List[EvaluationResult] = []

        # Accumulators cho average
        total_rouge1_f1 = 0.0
        total_rouge2_f1 = 0.0
        total_rougeL_f1 = 0.0
        total_rouge1_p = 0.0
        total_rouge1_r = 0.0
        total_rouge2_p = 0.0
        total_rouge2_r = 0.0
        total_rougeL_p = 0.0
        total_rougeL_r = 0.0

        for pair in pairs:
            scores = self.calculate_rouge(pair.generated_answer, pair.reference_answer)

            results.append(EvaluationResult(
                question=pair.question,
                generated_answer=pair.generated_answer,
                reference_answer=pair.reference_answer,
                scores=scores
            ))

            # Accumulate
            total_rouge1_f1 += scores.rouge1_fmeasure
            total_rouge2_f1 += scores.rouge2_fmeasure
            total_rougeL_f1 += scores.rougeL_fmeasure
            total_rouge1_p += scores.rouge1_precision
            total_rouge1_r += scores.rouge1_recall
            total_rouge2_p += scores.rouge2_precision
            total_rouge2_r += scores.rouge2_recall
            total_rougeL_p += scores.rougeL_precision
            total_rougeL_r += scores.rougeL_recall

        n = len(pairs) if pairs else 1

        average_scores = {
            "rouge1_precision": round(total_rouge1_p / n, 4),
            "rouge1_recall": round(total_rouge1_r / n, 4),
            "rouge1_f1": round(total_rouge1_f1 / n, 4),
            "rouge2_precision": round(total_rouge2_p / n, 4),
            "rouge2_recall": round(total_rouge2_r / n, 4),
            "rouge2_f1": round(total_rouge2_f1 / n, 4),
            "rougeL_precision": round(total_rougeL_p / n, 4),
            "rougeL_recall": round(total_rougeL_r / n, 4),
            "rougeL_f1": round(total_rougeL_f1 / n, 4),
            "overall_f1": round((total_rouge1_f1 + total_rouge2_f1 + total_rougeL_f1) / (3 * n), 4)
        }

        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        # Lưu vào history
        self._save_to_history(results, average_scores)

        return BatchEvaluationResponse(
            total_pairs=len(pairs),
            results=results,
            average_scores=average_scores,
            evaluation_time=f"{duration:.2f}s"
        )

    def _save_to_history(
        self,
        results: List[EvaluationResult],
        average_scores: Dict[str, float]
    ):
        """Lưu kết quả evaluation vào history"""
        self.evaluation_history.append({
            "timestamp": datetime.now().isoformat(),
            "num_pairs": len(results),
            "average_scores": average_scores
        })

        # Giữ tối đa 100 records
        if len(self.evaluation_history) > 100:
            self.evaluation_history = self.evaluation_history[-100:]

    def export_results_to_json(
        self,
        results: BatchEvaluationResponse,
        filepath: str
    ) -> str:
        """
        Export kết quả ra file JSON

        Args:
            results: Kết quả evaluation
            filepath: Đường dẫn file output

        Returns:
            Đường dẫn file đã lưu
        """
        data = {
            "evaluation_time": results.evaluation_time,
            "total_pairs": results.total_pairs,
            "average_scores": results.average_scores,
            "results": [
                {
                    "question": r.question,
                    "generated_answer": r.generated_answer,
                    "reference_answer": r.reference_answer,
                    "scores": {
                        "rouge1": {
                            "precision": r.scores.rouge1_precision,
                            "recall": r.scores.rouge1_recall,
                            "f1": r.scores.rouge1_fmeasure
                        },
                        "rouge2": {
                            "precision": r.scores.rouge2_precision,
                            "recall": r.scores.rouge2_recall,
                            "f1": r.scores.rouge2_fmeasure
                        },
                        "rougeL": {
                            "precision": r.scores.rougeL_precision,
                            "recall": r.scores.rougeL_recall,
                            "f1": r.scores.rougeL_fmeasure
                        }
                    }
                }
                for r in results.results
            ]
        }

        os.makedirs(os.path.dirname(filepath) if os.path.dirname(filepath) else '.', exist_ok=True)

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        logger.info(f"Results exported to {filepath}")
        return filepath

    def get_evaluation_history(self) -> List[Dict]:
        """Lấy lịch sử evaluation"""
        return self.evaluation_history

    def interpret_scores(self, scores: RougeScores) -> Dict[str, str]:
        """
        Giải thích ý nghĩa của ROUGE scores

        Args:
            scores: ROUGE scores

        Returns:
            Dict với giải thích cho từng metric
        """
        def interpret_value(value: float, metric: str) -> str:
            if value >= 0.7:
                return f"{metric}: Xuất sắc ({value:.2%}) - Độ trùng khớp rất cao"
            elif value >= 0.5:
                return f"{metric}: Tốt ({value:.2%}) - Độ trùng khớp khá tốt"
            elif value >= 0.3:
                return f"{metric}: Trung bình ({value:.2%}) - Có sự tương đồng"
            elif value >= 0.1:
                return f"{metric}: Thấp ({value:.2%}) - Ít tương đồng"
            else:
                return f"{metric}: Rất thấp ({value:.2%}) - Gần như không tương đồng"

        return {
            "rouge1": interpret_value(scores.rouge1_fmeasure, "ROUGE-1"),
            "rouge2": interpret_value(scores.rouge2_fmeasure, "ROUGE-2"),
            "rougeL": interpret_value(scores.rougeL_fmeasure, "ROUGE-L"),
            "summary": self._overall_interpretation(scores)
        }

    def _overall_interpretation(self, scores: RougeScores) -> str:
        """Đánh giá tổng thể"""
        avg = (scores.rouge1_fmeasure + scores.rouge2_fmeasure + scores.rougeL_fmeasure) / 3

        if avg >= 0.6:
            return "RAG system hoạt động rất tốt, câu trả lời gần với ground truth"
        elif avg >= 0.4:
            return "RAG system hoạt động tốt, câu trả lời có độ tương đồng khá"
        elif avg >= 0.2:
            return "RAG system cần cải thiện, câu trả lời chưa đủ chính xác"
        else:
            return "RAG system cần xem xét lại, câu trả lời khác biệt nhiều so với ground truth"


# Singleton instance
rouge_evaluation_service = RougeEvaluationService()
