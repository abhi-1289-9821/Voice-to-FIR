import pytest
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from training.predict import ComplaintClassifier, predict_category
from config import CATEGORIES


def test_classifier_singleton_and_classes():
    classifier = ComplaintClassifier.get_instance()
    assert classifier is not None
    assert len(classifier.classes) == 7
    for cat in CATEGORIES:
        assert cat in classifier.classes


def test_theft_prediction():
    text = "Someone broke into my car and stole my laptop and wallet outside metro station."
    res = predict_category(text)
    assert res["status"] == "success"
    assert res["predicted_category"] == "Theft"
    assert 0.0 <= res["confidence"] <= 1.0
    # Probabilities must sum to ~1.0
    prob_sum = sum(res["class_probabilities"].values())
    assert abs(prob_sum - 1.0) < 0.05


def test_cyber_fraud_prediction():
    text = "Fake electricity bill SMS received and 35000 rupees debited from my bank account via fraudulent UPI link."
    res = predict_category(text)
    assert res["predicted_category"] == "Cyber Fraud"
    assert res["confidence"] > 0.25


def test_hindi_lost_documents_prediction():
    text = "बीडीए कॉम्प्लेक्स में मेरा पर्स गिर गया जिसमें आधार कार्ड और पैन कार्ड थे।"
    res = predict_category(text)
    assert res["predicted_category"] == "Lost Documents"
    assert res["confidence"] > 0.25


def test_empty_input_handling():
    res = predict_category("")
    assert res["status"] == "empty_input"
    assert res["confidence"] == 0.0
