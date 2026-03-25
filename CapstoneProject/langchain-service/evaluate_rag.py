"""Evaluate RAG outputs using ROUGE and BLEU.

Usage examples:

1) Evaluate using a local predictions file:
   python evaluate_rag.py --refs data/refs.jsonl --preds data/preds.jsonl

2) Evaluate by calling your running API (e.g., /api/pdf/search):
   python evaluate_rag.py --refs data/refs.jsonl --api-url http://localhost:8000/api/pdf/search

Expected input format (JSONL):
  {"id": 1, "query": "...", "reference": "..."}

The script will compute average ROUGE-1/2/L and BLEU-4.
"""

import argparse
import json
import os
import sys
from typing import Dict, List, Optional


def load_jsonl(path: str) -> List[Dict]:
    if not os.path.exists(path):
        raise FileNotFoundError(f"File not found: {path}")

    items = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            items.append(json.loads(line))
    return items


def safe_get(item: Dict, key: str, default=None):
    return item.get(key, default) if isinstance(item, dict) else default


def make_prediction_from_search(api_url: str, query: str, top_k: int = 5) -> str:
    """Call FastAPI search endpoint and return a single string to compare."""
    try:
        import requests
    except ImportError as e:
        raise RuntimeError("requests is required for API evaluation. Install with `pip install requests`.") from e

    resp = requests.post(api_url, params={"query": query, "top_k": top_k})
    resp.raise_for_status()
    data = resp.json()

    # If the endpoint returns a list of chunks, join them
    if isinstance(data, dict) and "results" in data:
        chunks = [r.get("content", "") for r in data.get("results", [])]
        return "\n".join(chunks).strip()

    # Fallback: return raw text
    return str(data)


def compute_scores(references: List[str], predictions: List[str]) -> Dict[str, float]:
    """Compute average ROUGE and BLEU across all pairs."""
    try:
        from rouge_score import rouge_scorer
    except ImportError as e:
        raise RuntimeError("rouge-score is required for ROUGE evaluation. Install with `pip install rouge-score`.") from e

    try:
        from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
    except ImportError as e:
        raise RuntimeError("nltk is required for BLEU evaluation. Install with `pip install nltk`.") from e

    # Ensure NLTK tokenizer data is available
    try:
        import nltk
        nltk.data.find("tokenizers/punkt")
    except Exception:
        import nltk
        nltk.download("punkt")

    scorer = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)
    total = {
        "rouge1": 0.0,
        "rouge2": 0.0,
        "rougeL": 0.0,
        "bleu": 0.0,
    }

    smoothing = SmoothingFunction().method2

    for ref, pred in zip(references, predictions):
        if not ref or not pred:
            continue

        r = scorer.score(ref, pred)
        total["rouge1"] += r["rouge1"].fmeasure
        total["rouge2"] += r["rouge2"].fmeasure
        total["rougeL"] += r["rougeL"].fmeasure

        # BLEU expects token lists
        ref_tokens = ref.split()
        pred_tokens = pred.split()
        bleu = sentence_bleu([ref_tokens], pred_tokens, smoothing_function=smoothing)
        total["bleu"] += bleu

    n = len(references)
    if n == 0:
        raise ValueError("No examples to evaluate.")

    return {
        "rouge1": total["rouge1"] / n,
        "rouge2": total["rouge2"] / n,
        "rougeL": total["rougeL"] / n,
        "bleu": total["bleu"] / n,
    }


def main():
    parser = argparse.ArgumentParser(description="Evaluate RAG outputs with ROUGE and BLEU")
    parser.add_argument("--refs", required=True, help="Path to reference JSONL file (query + reference)")
    parser.add_argument("--preds", help="Path to predictions JSONL file (query + prediction)")
    parser.add_argument("--api-url", help="API URL to call for predictions (e.g., http://localhost:8000/api/pdf/search)")
    parser.add_argument("--top-k", type=int, default=5, help="Top K chunks to concatenate when calling the API")
    args = parser.parse_args()

    refs = load_jsonl(args.refs)

    if args.preds:
        preds = load_jsonl(args.preds)
        # Align by query if possible
        query_to_pred = {safe_get(x, "query"): safe_get(x, "prediction", safe_get(x, "answer", "")) for x in preds}
        predictions = [query_to_pred.get(safe_get(r, "query", ""), "") for r in refs]
    elif args.api_url:
        predictions = []
        for item in refs:
            query = safe_get(item, "query", "")
            if not query:
                predictions.append("")
                continue
            try:
                # allow passing top_k in API call
                pred = make_prediction_from_search(args.api_url, query, top_k=args.top_k)
                predictions.append(pred)
            except Exception as e:
                print(f"[WARN] Failed to call API for query '{query}': {e}")
                predictions.append("")
    else:
        raise ValueError("Either --preds or --api-url must be provided")

    references = [safe_get(r, "reference", "") for r in refs]

    scores = compute_scores(references, predictions)

    print("\n=== Evaluation results ===")
    print(f"ROUGE-1: {scores['rouge1']:.4f}")
    print(f"ROUGE-2: {scores['rouge2']:.4f}")
    print(f"ROUGE-L: {scores['rougeL']:.4f}")
    print(f"BLEU-4:  {scores['bleu']:.4f}")


if __name__ == "__main__":
    main()
