import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional
import joblib
import numpy as np

import sys
sys.path.append(str(Path(__file__).resolve().parent.parent))

from config import CLASSIFIER_MODEL_DIR, MODEL_ARTIFACTS
from nlp.text_preprocessing import preprocess_for_tfidf

logger = logging.getLogger("Predictor")


class ComplaintClassifier:
    _instance: Optional["ComplaintClassifier"] = None

    def __init__(self, model_type: str = "logistic_regression"):
        self.model_type = model_type
        self.vectorizer = None
        self.model = None
        self.metadata = {}
        self.classes = []
        self._load_artifacts()

    @classmethod
    def get_instance(cls, model_type: str = "logistic_regression") -> "ComplaintClassifier":
        if cls._instance is None:
            cls._instance = cls(model_type=model_type)
        return cls._instance

    def _load_artifacts(self):
        vec_path = MODEL_ARTIFACTS["vectorizer_path"]
        model_path = (
            MODEL_ARTIFACTS["model_path"]
            if self.model_type == "logistic_regression"
            else MODEL_ARTIFACTS["svm_model_path"]
        )
        meta_path = MODEL_ARTIFACTS["metadata_path"]

        if not vec_path.exists() or not model_path.exists():
            raise FileNotFoundError(
                f"Model artifacts missing in {CLASSIFIER_MODEL_DIR}. Please run training first."
            )

        self.vectorizer = joblib.load(vec_path)
        self.model = joblib.load(model_path)
        self.classes = list(self.model.classes_)

        if meta_path.exists():
            with open(meta_path, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)

        logger.info(f"Loaded {self.model_type} classifier with {len(self.classes)} classes.")

    def predict(self, text: str) -> Dict[str, Any]:
        """
        Run inference using the actual trained model.
        Returns predicted category, true model class probabilities, and confidence score.
        """
        if not text or not text.strip():
            return {
                "predicted_category": "Other",
                "confidence": 0.0,
                "class_probabilities": {c: 0.0 for c in self.classes},
                "model_name": self.model_type,
                "cleaned_text": "",
                "status": "empty_input",
            }

        cleaned = preprocess_for_tfidf(text)
        if not cleaned:
            return {
                "predicted_category": "Other",
                "confidence": 0.0,
                "class_probabilities": {c: round(1.0 / len(self.classes), 4) for c in self.classes},
                "model_name": self.model_type,
                "cleaned_text": "",
                "status": "uninformative_input",
            }

        X_vec = self.vectorizer.transform([cleaned])

        # Obtain actual class probabilities from Logistic Regression or Calibrated SVM
        probs = self.model.predict_proba(X_vec)[0]
        prob_dict = {
            cls_name: round(float(prob), 4)
            for cls_name, prob in zip(self.classes, probs)
        }
        # Sort descending by probability
        prob_dict = dict(sorted(prob_dict.items(), key=lambda item: item[1], reverse=True))

        top_class = max(prob_dict, key=prob_dict.get)
        confidence = float(prob_dict[top_class])

        return {
            "predicted_category": top_class,
            "confidence": round(confidence, 4),
            "class_probabilities": prob_dict,
            "model_name": self.metadata.get("model_name", "TF-IDF + Logistic Regression"),
            "cleaned_text": cleaned,
            "status": "success",
        }


def predict_category(text: str, model_type: str = "logistic_regression") -> Dict[str, Any]:
    classifier = ComplaintClassifier.get_instance(model_type=model_type)
    return classifier.predict(text)


if __name__ == "__main__":
    sample = "Someone broke into my car and stole my laptop bag at Indiranagar metro station"
    res = predict_category(sample)
    print("Test Sample:", sample)
    print("Prediction:", res["predicted_category"], f"(Confidence: {res['confidence'] * 100:.1f}%)")
    print("Probabilities:", res["class_probabilities"])
