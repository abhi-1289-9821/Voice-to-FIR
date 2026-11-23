import json
import logging
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.svm import LinearSVC

import sys
# Add parent dir to path so we can import config and nlp modules
sys.path.append(str(Path(__file__).resolve().parent.parent))

from config import (
    CATEGORIES,
    CLASSIFIER_MODEL_DIR,
    MODEL_ARTIFACTS,
    PROCESSED_DATA_DIR,
    RAW_DATA_DIR,
)
from nlp.text_preprocessing import clean_text, preprocess_for_tfidf

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("Trainer")


def load_and_preprocess_data():
    raw_path = RAW_DATA_DIR / "complaints_dataset.csv"
    if not raw_path.exists():
        raise FileNotFoundError(f"Raw dataset not found at {raw_path}")

    df = pd.read_csv(raw_path)
    logger.info(f"Loaded {len(df)} samples from {raw_path}")

    # Drop nulls and exact duplicates
    df = df.dropna(subset=["complaint_text", "category"])
    df = df.drop_duplicates(subset=["complaint_text"])
    logger.info(f"Samples after deduplication: {len(df)}")

    # Clean and preprocess text
    df["cleaned_text"] = df["complaint_text"].apply(preprocess_for_tfidf)
    # Remove any samples that became empty after preprocessing
    df = df[df["cleaned_text"].str.strip().str.len() > 0]

    # Save processed dataset
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    processed_path = PROCESSED_DATA_DIR / "cleaned_complaints.csv"
    df.to_csv(processed_path, index=False, encoding="utf-8")
    logger.info(f"Saved processed dataset to {processed_path}")

    return df


def train_models():
    df = load_and_preprocess_data()

    X = df["cleaned_text"].values
    y = df["category"].values

    # Stratified Train/Test Split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    logger.info(f"Train split: {len(X_train)} samples | Test split: {len(X_test)} samples")

    # Save train/test partitions for reproducibility
    train_df = pd.DataFrame({"text": X_train, "category": y_train})
    test_df = pd.DataFrame({"text": X_test, "category": y_test})
    train_df.to_csv(PROCESSED_DATA_DIR / "train.csv", index=False, encoding="utf-8")
    test_df.to_csv(PROCESSED_DATA_DIR / "test.csv", index=False, encoding="utf-8")

    # TF-IDF Vectorizer with word & sub-word n-grams for multilingual resilience
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=1,
        max_df=0.95,
        token_pattern=r"(?u)\b\w+\b",
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    logger.info(f"Vocabulary size: {len(vectorizer.vocabulary_)} features")

    # 1. Primary Model: Logistic Regression
    lr_model = LogisticRegression(
        C=2.5,
        max_iter=1000,
        random_state=42,
        class_weight="balanced",
        solver="lbfgs"
    )
    lr_model.fit(X_train_vec, y_train)

    # 5-fold Stratified Cross Validation on Train Set
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    lr_cv_scores = cross_val_score(lr_model, X_train_vec, y_train, cv=cv, scoring="accuracy")
    logger.info(f"Logistic Regression 5-fold CV Accuracy: {lr_cv_scores.mean():.4f} (+/- {lr_cv_scores.std():.4f})")

    y_pred_lr = lr_model.predict(X_test_vec)
    lr_test_acc = accuracy_score(y_test, y_pred_lr)
    lr_test_f1 = f1_score(y_test, y_pred_lr, average="weighted")
    logger.info(f"Logistic Regression Test Accuracy: {lr_test_acc:.4f} | F1: {lr_test_f1:.4f}")

    # 2. Baseline Model: Linear SVM with Platt Calibration for true probabilities
    svm_base = LinearSVC(C=1.0, random_state=42, class_weight="balanced", max_iter=2000)
    svm_calibrated = CalibratedClassifierCV(estimator=svm_base, cv=3)
    svm_calibrated.fit(X_train_vec, y_train)

    y_pred_svm = svm_calibrated.predict(X_test_vec)
    svm_test_acc = accuracy_score(y_test, y_pred_svm)
    svm_test_f1 = f1_score(y_test, y_pred_svm, average="weighted")
    logger.info(f"Linear SVM Test Accuracy: {svm_test_acc:.4f} | F1: {svm_test_f1:.4f}")

    # Save artifacts
    CLASSIFIER_MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(vectorizer, MODEL_ARTIFACTS["vectorizer_path"])
    joblib.dump(lr_model, MODEL_ARTIFACTS["model_path"])
    joblib.dump(svm_calibrated, MODEL_ARTIFACTS["svm_model_path"])

    metadata = {
        "model_name": "TF-IDF + Logistic Regression",
        "baseline_model_name": "TF-IDF + Calibrated Linear SVM",
        "categories": list(lr_model.classes_),
        "num_classes": len(lr_model.classes_),
        "total_samples": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "vocabulary_size": len(vectorizer.vocabulary_),
        "cv_accuracy_mean": float(lr_cv_scores.mean()),
        "cv_accuracy_std": float(lr_cv_scores.std()),
        "test_accuracy": float(lr_test_acc),
        "test_f1_weighted": float(lr_test_f1),
        "svm_test_accuracy": float(svm_test_acc),
        "svm_test_f1_weighted": float(svm_test_f1),
        "hyperparameters": {
            "ngram_range": [1, 2],
            "sublinear_tf": True,
            "C": 2.5,
            "max_iter": 1000,
            "class_weight": "balanced"
        }
    }

    with open(MODEL_ARTIFACTS["metadata_path"], "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    logger.info(f"Successfully saved model artifacts to {CLASSIFIER_MODEL_DIR}")
    return metadata


if __name__ == "__main__":
    train_models()
