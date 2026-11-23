from typing import Any, Dict, List, Tuple
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)


def compute_classification_metrics(
    y_true: List[str], y_pred: List[str], labels: List[str]
) -> Dict[str, Any]:
    """
    Compute comprehensive classification metrics from actual predictions.
    Never fabricated; directly computed via scikit-learn.
    """
    acc = float(accuracy_score(y_true, y_pred))
    prec_macro = float(precision_score(y_true, y_pred, labels=labels, average="macro", zero_division=0))
    rec_macro = float(recall_score(y_true, y_pred, labels=labels, average="macro", zero_division=0))
    f1_macro = float(f1_score(y_true, y_pred, labels=labels, average="macro", zero_division=0))

    prec_weighted = float(precision_score(y_true, y_pred, labels=labels, average="weighted", zero_division=0))
    rec_weighted = float(recall_score(y_true, y_pred, labels=labels, average="weighted", zero_division=0))
    f1_weighted = float(f1_score(y_true, y_pred, labels=labels, average="weighted", zero_division=0))

    report_dict = classification_report(
        y_true, y_pred, labels=labels, output_dict=True, zero_division=0
    )
    cm = confusion_matrix(y_true, y_pred, labels=labels).tolist()

    per_class_metrics = {}
    for label in labels:
        if label in report_dict:
            per_class_metrics[label] = {
                "precision": round(float(report_dict[label]["precision"]), 4),
                "recall": round(float(report_dict[label]["recall"]), 4),
                "f1_score": round(float(report_dict[label]["f1-score"]), 4),
                "support": int(report_dict[label]["support"]),
            }

    return {
        "accuracy": round(acc, 4),
        "precision_macro": round(prec_macro, 4),
        "recall_macro": round(rec_macro, 4),
        "f1_macro": round(f1_macro, 4),
        "precision_weighted": round(prec_weighted, 4),
        "recall_weighted": round(rec_weighted, 4),
        "f1_weighted": round(f1_weighted, 4),
        "per_class": per_class_metrics,
        "confusion_matrix": cm,
        "labels": labels,
    }


def compute_word_error_rate(reference: str, hypothesis: str) -> Dict[str, Any]:
    """
    Standard Word Error Rate (WER) using Levenshtein distance on token sequences.
    WER = (S + D + I) / N
    """
    ref_words = reference.strip().lower().split()
    hyp_words = hypothesis.strip().lower().split()

    r_len = len(ref_words)
    h_len = len(hyp_words)

    if r_len == 0:
        return {"wer": 0.0 if h_len == 0 else 1.0, "substitutions": 0, "deletions": 0, "insertions": h_len, "ref_words": 0}

    # Levenshtein distance matrix
    d = np.zeros((r_len + 1, h_len + 1), dtype=np.uint32)
    for i in range(r_len + 1):
        d[i, 0] = i
    for j in range(h_len + 1):
        d[0, j] = j

    for i in range(1, r_len + 1):
        for j in range(1, h_len + 1):
            if ref_words[i - 1] == hyp_words[j - 1]:
                d[i, j] = d[i - 1, j - 1]
            else:
                substitution = d[i - 1, j - 1] + 1
                insertion = d[i, j - 1] + 1
                deletion = d[i - 1, j] + 1
                d[i, j] = min(substitution, insertion, deletion)

    distance = int(d[r_len, h_len])
    wer = round(float(distance) / float(r_len), 4)

    return {
        "wer": wer,
        "levenshtein_distance": distance,
        "ref_word_count": r_len,
        "hyp_word_count": h_len,
    }
