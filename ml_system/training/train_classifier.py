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
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.pipeline import FeatureUnion
from sklearn.svm import LinearSVC

import sys
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


def build_feature_union_vectorizer():
    """
    Construct high-capacity word & sub-word character n-gram FeatureUnion.
    - Word n-grams (1-3): Collocations and multi-word legal/incident phrases.
    - Char_wb n-grams (2-5): Resilient to phonetic spelling variations in Hinglish,
      Hindi inflections, typos, and ASR transcription artifacts.
    """
    return FeatureUnion([
        ("word", TfidfVectorizer(
            ngram_range=(1, 3),
            sublinear_tf=True,
            min_df=2,
            max_df=0.90,
            token_pattern=r"(?u)\b\w+\b"
        )),
        ("char", TfidfVectorizer(
            ngram_range=(2, 5),
            analyzer="char_wb",
            sublinear_tf=True,
            min_df=2,
            max_df=0.90
        ))
    ])


def train_models():
    train_val_path = PROCESSED_DATA_DIR / "train_val.csv"
    test_path = PROCESSED_DATA_DIR / "test.csv"

    if not train_val_path.exists() or not test_path.exists():
        raise FileNotFoundError("Processed splits not found. Run create_splits.py first.")

    train_val_df = pd.read_csv(train_val_path)
    test_df = pd.read_csv(test_path)

    X_train = train_val_df["text"].values
    y_train = train_val_df["category"].values
    X_test = test_df["text"].values
    y_test = test_df["category"].values

    logger.info(f"Loaded train+val set: {len(X_train)} samples | Test set: {len(X_test)} samples")

    # 1. Fit FeatureUnion Vectorizer
    vectorizer = build_feature_union_vectorizer()
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    # Calculate total vocabulary dimensions across word and char branches
    word_vocab = len(vectorizer.transformer_list[0][1].vocabulary_)
    char_vocab = len(vectorizer.transformer_list[1][1].vocabulary_)
    total_features = X_train_vec.shape[1]
    logger.info(f"FeatureUnion Dimensions: {total_features} total features (Word: {word_vocab}, Char_wb: {char_vocab})")

    # 2. Primary Model: Tuned Multilingual Logistic Regression
    lr_model = LogisticRegression(
        C=4.0,
        max_iter=1000,
        random_state=42,
        class_weight="balanced",
        solver="lbfgs"
    )
    lr_model.fit(X_train_vec, y_train)

    # 5-fold Stratified Cross Validation on Train+Val Set
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    lr_cv_scores = cross_val_score(lr_model, X_train_vec, y_train, cv=cv, scoring="accuracy")
    lr_cv_f1 = cross_val_score(lr_model, X_train_vec, y_train, cv=cv, scoring="f1_macro")
    logger.info(f"Logistic Regression 5-fold CV Accuracy: {lr_cv_scores.mean()*100:.2f}% (±{lr_cv_scores.std()*100:.2f}%) | Macro F1: {lr_cv_f1.mean():.4f}")

    # Evaluate on held-out test split
    y_pred_lr = lr_model.predict(X_test_vec)
    lr_test_acc = accuracy_score(y_test, y_pred_lr)
    lr_test_f1 = f1_score(y_test, y_pred_lr, average="weighted")
    lr_test_macro_f1 = f1_score(y_test, y_pred_lr, average="macro")
    logger.info(f"Primary LR Held-out Accuracy: {lr_test_acc*100:.2f}% | Weighted F1: {lr_test_f1:.4f} | Macro F1: {lr_test_macro_f1:.4f}")

    # 3. Baseline Model: Calibrated Linear SVM
    svm_base = LinearSVC(C=1.5, random_state=42, class_weight="balanced", max_iter=3000, dual=False)
    svm_calibrated = CalibratedClassifierCV(estimator=svm_base, cv=3)
    svm_calibrated.fit(X_train_vec, y_train)

    y_pred_svm = svm_calibrated.predict(X_test_vec)
    svm_test_acc = accuracy_score(y_test, y_pred_svm)
    svm_test_f1 = f1_score(y_test, y_pred_svm, average="weighted")
    logger.info(f"Baseline SVM Held-out Accuracy: {svm_test_acc*100:.2f}% | Weighted F1: {svm_test_f1:.4f}")

    # Save artifacts
    CLASSIFIER_MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(vectorizer, MODEL_ARTIFACTS["vectorizer_path"])
    joblib.dump(lr_model, MODEL_ARTIFACTS["model_path"])
    joblib.dump(svm_calibrated, MODEL_ARTIFACTS["svm_model_path"])

    metadata = {
        "model_name": "FeatureUnion (Word 1-3 + Char_wb 2-5) + Logistic Regression (C=4.0, balanced)",
        "baseline_model_name": "FeatureUnion + Calibrated Linear SVM (C=1.5, 3-fold Platt calibration)",
        "categories": list(lr_model.classes_),
        "num_classes": len(lr_model.classes_),
        "total_dataset_samples": len(train_val_df) + len(test_df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "total_features": int(total_features),
        "word_vocab_size": int(word_vocab),
        "char_vocab_size": int(char_vocab),
        "cv_accuracy_mean": float(lr_cv_scores.mean()),
        "cv_accuracy_std": float(lr_cv_scores.std()),
        "cv_macro_f1": float(lr_cv_f1.mean()),
        "test_accuracy": float(lr_test_acc),
        "test_weighted_f1": float(lr_test_f1),
        "test_macro_f1": float(lr_test_macro_f1),
        "svm_test_accuracy": float(svm_test_acc),
        "svm_test_f1_weighted": float(svm_test_f1),
        "hyperparameters": {
            "feature_union": ["word (1-3)", "char_wb (2-5)"],
            "sublinear_tf": True,
            "C": 4.0,
            "max_iter": 1000,
            "class_weight": "balanced",
            "solver": "lbfgs"
        }
    }

    with open(MODEL_ARTIFACTS["metadata_path"], "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    logger.info(f"Successfully saved all model artifacts and metadata to {CLASSIFIER_MODEL_DIR}")
    return metadata


if __name__ == "__main__":
    train_models()
