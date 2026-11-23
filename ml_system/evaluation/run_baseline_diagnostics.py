import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

import joblib
import pandas as pd
import numpy as np
from config import PROCESSED_DATA_DIR, MODEL_ARTIFACTS
from evaluation.metrics import compute_classification_metrics

test_df = pd.read_csv(PROCESSED_DATA_DIR / "test.csv")
X_test = test_df["text"].values
y_test = test_df["category"].values

vec = joblib.load(MODEL_ARTIFACTS["vectorizer_path"])
lr = joblib.load(MODEL_ARTIFACTS["model_path"])
svm = joblib.load(MODEL_ARTIFACTS["svm_model_path"])
labels = list(lr.classes_)

X_vec = vec.transform(X_test)
preds_lr = lr.predict(X_vec)
probs_lr = lr.predict_proba(X_vec)
conf_lr = np.max(probs_lr, axis=1)

preds_svm = svm.predict(X_vec)

metrics_lr = compute_classification_metrics(y_test, preds_lr, labels=labels)
metrics_svm = compute_classification_metrics(y_test, preds_svm, labels=labels)

print("==================================================")
print("PRIMARY MODEL (TF-IDF + Logistic Regression)")
print(f"Accuracy:           {metrics_lr['accuracy']:.4f}")
print(f"Weighted F1:        {metrics_lr['f1_weighted']:.4f}")
print(f"Macro F1:           {metrics_lr['f1_macro']:.4f}")
print(f"Weighted Precision: {metrics_lr['precision_weighted']:.4f}")
print(f"Weighted Recall:    {metrics_lr['recall_weighted']:.4f}")
print("==================================================")

print("\nPER CLASS METRICS (Logistic Regression):")
for cat, m in metrics_lr["per_class"].items():
    print(f"  {cat:22s} | P: {m['precision']:.4f} | R: {m['recall']:.4f} | F1: {m['f1_score']:.4f} | Support: {m['support']}")

print("\nCONFUSION MATRIX LABELS:")
print(labels)
print("\nCONFUSION MATRIX (Logistic Regression):")
cm = np.array(metrics_lr["confusion_matrix"])
print(cm)

print("\n==================================================")
print("MISCLASSIFIED TEST SAMPLES (Logistic Regression):")
mis_count = 0
misclassified_records = []
for i in range(len(y_test)):
    if y_test[i] != preds_lr[i]:
        mis_count += 1
        record = {
            "index": i,
            "true_label": y_test[i],
            "pred_label": preds_lr[i],
            "confidence": float(conf_lr[i]),
            "text": X_test[i]
        }
        misclassified_records.append(record)
        print(f"\n{mis_count}. TRUE: [{y_test[i]}] -> PREDICTED: [{preds_lr[i]}] (Conf: {conf_lr[i]:.4f})")
        print(f"   Text: {X_test[i]}")

print(f"\nTotal Misclassified: {mis_count} out of {len(y_test)} ({mis_count/len(y_test)*100:.1f}%)")

# Baseline SVM
print("\n==================================================")
print("BASELINE MODEL (TF-IDF + Calibrated Linear SVM)")
print(f"Accuracy:           {metrics_svm['accuracy']:.4f}")
print(f"Weighted F1:        {metrics_svm['f1_weighted']:.4f}")
print(f"Macro F1:           {metrics_svm['f1_macro']:.4f}")
print("==================================================")
