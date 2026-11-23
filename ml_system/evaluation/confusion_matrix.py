from pathlib import Path
from typing import List
import matplotlib
matplotlib.use("Agg")  # Headless backend suitable for server/scripts
import matplotlib.pyplot as plt
import numpy as np


def plot_confusion_matrix(
    cm: List[List[int]],
    labels: List[str],
    output_path: Path,
    title: str = "AwaazSetu Complaint Classification - Confusion Matrix",
):
    """Render and save an annotated confusion matrix plot."""
    cm_arr = np.array(cm)
    fig, ax = plt.subplots(figsize=(9, 7))

    im = ax.imshow(cm_arr, interpolation="nearest", cmap=plt.cm.Blues)
    ax.figure.colorbar(im, ax=ax)

    ax.set(
        xticks=np.arange(cm_arr.shape[1]),
        yticks=np.arange(cm_arr.shape[0]),
        xticklabels=labels,
        yticklabels=labels,
        title=title,
        ylabel="True Category",
        xlabel="Predicted Category",
    )

    plt.setp(ax.get_xticklabels(), rotation=40, ha="right", rotation_mode="anchor")

    # Add numeric annotations inside each cell
    thresh = cm_arr.max() / 2.0 if cm_arr.max() > 0 else 1
    for i in range(cm_arr.shape[0]):
        for j in range(cm_arr.shape[1]):
            ax.text(
                j,
                i,
                format(cm_arr[i, j], "d"),
                ha="center",
                va="center",
                color="white" if cm_arr[i, j] > thresh else "black",
                fontweight="bold" if cm_arr[i, j] > 0 else "normal",
            )

    fig.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=200)
    plt.close()


def plot_per_class_metrics(
    per_class_metrics: dict,
    output_path: Path,
    title: str = "Per-Category Evaluation Metrics (Precision, Recall, F1)",
):
    """Render a grouped bar chart for precision, recall, and F1 across categories."""
    categories = list(per_class_metrics.keys())
    precisions = [per_class_metrics[c]["precision"] for c in categories]
    recalls = [per_class_metrics[c]["recall"] for c in categories]
    f1_scores = [per_class_metrics[c]["f1_score"] for c in categories]

    x = np.arange(len(categories))
    width = 0.25

    fig, ax = plt.subplots(figsize=(10, 6))
    ax.bar(x - width, precisions, width, label="Precision", color="#3b82f6")
    ax.bar(x, recalls, width, label="Recall", color="#10b981")
    ax.bar(x + width, f1_scores, width, label="F1-Score", color="#f59e0b")

    ax.set_ylabel("Score (0.0 to 1.0)")
    ax.set_title(title, fontweight="bold")
    ax.set_xticks(x)
    ax.set_xticklabels(categories, rotation=30, ha="right")
    ax.set_ylim(0, 1.1)
    ax.legend(loc="lower right")
    ax.grid(axis="y", linestyle="--", alpha=0.5)

    fig.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=200)
    plt.close()
