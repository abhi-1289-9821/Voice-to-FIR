import hashlib
import time
from pathlib import Path
import pandas as pd
import pytest
from sklearn.metrics import accuracy_score, recall_score

import sys
sys.path.append(str(Path(__file__).resolve().parent.parent))

from config import CATEGORIES, EVALUATION_DIR, PROCESSED_DATA_DIR
from training.predict import ComplaintClassifier, predict_category


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


# =========================================================================
# RIGOROUS ACCURACY, INTEGRITY, RECALL, LATENCY & MULTILINGUAL TEST SUITE
# =========================================================================

def test_frozen_test_set_hash_integrity():
    """Verify that the held-out test set has not been tampered with or leaked."""
    test_path = PROCESSED_DATA_DIR / "test.csv"
    hash_path = EVALUATION_DIR / "test_set_hash.txt"

    assert test_path.exists(), f"Missing test set at {test_path}"
    assert hash_path.exists(), f"Missing test hash at {hash_path}"

    with open(test_path, "rb") as f:
        actual_hash = hashlib.sha256(f.read()).hexdigest()

    with open(hash_path, "r", encoding="utf-8") as f:
        expected_hash = f.read().strip()

    assert actual_hash == expected_hash, (
        f"Test set hash mismatch! Expected {expected_hash}, got {actual_hash}. "
        "The test set must remain strictly frozen."
    )


def test_held_out_accuracy_threshold():
    """Verify held-out test accuracy is at least 90.0% on frozen test.csv."""
    test_path = PROCESSED_DATA_DIR / "test.csv"
    df = pd.read_csv(test_path)
    assert len(df) >= 240, f"Test set must have at least 240 samples, found {len(df)}"

    classifier = ComplaintClassifier.get_instance()
    preds = [classifier.predict(text)["predicted_category"] for text in df["text"]]
    y_true = df["category"].tolist()

    acc = accuracy_score(y_true, preds)
    assert acc >= 0.90, f"Held-out test accuracy {acc:.4f} is below required threshold 0.90"


def test_every_class_recall_threshold():
    """Verify held-out test recall is >= 0.80 for every single category."""
    test_path = PROCESSED_DATA_DIR / "test.csv"
    df = pd.read_csv(test_path)

    classifier = ComplaintClassifier.get_instance()
    preds = [classifier.predict(text)["predicted_category"] for text in df["text"]]
    y_true = df["category"].tolist()

    classes = classifier.classes
    recalls = recall_score(y_true, preds, labels=classes, average=None, zero_division=0)

    for cls_name, rec in zip(classes, recalls):
        assert rec >= 0.80, f"Class '{cls_name}' recall {rec:.4f} is below required threshold 0.80"


@pytest.mark.parametrize(
    "text,expected_category",
    [
        (
            "Someone broke into my car and stole my Wildcraft backpack and HP laptop near metro station.",
            "Theft",
        ),
        (
            "बस स्टॉप पर किसी ने मेरी जेब से फोन और बटुआ निकाल लिया चोरी हो गया।",
            "Theft",
        ),
        (
            "I received a phishing link claiming electricity bill unpaid and lost 45000 rupees from my bank account.",
            "Cyber Fraud",
        ),
        (
            "Mera bank account se fake UPI QR scan karke 25000 rupaye deduct ho gaye fraud message aaya tha.",
            "Cyber Fraud",
        ),
        (
            "An unknown person has been stalking me and sending abusive threatening messages on Instagram continuously.",
            "Harassment",
        ),
        (
            "Ek ladka daily coaching ke raste me peechha karta hai aur ashleel comments pass karta hai harassment kar raha hai.",
            "Harassment",
        ),
        (
            "मेरा 12 साल का बेटा कल दोपहर से कोचिंग से घर नहीं लौटा है सभी जगह ढूंढ लिया लापता है।",
            "Missing Person",
        ),
        (
            "मेट्रो में यात्रा करते समय मेरा पर्स खो गया जिसमें आधार कार्ड और ड्राइविंग लाइसेंस था।",
            "Lost Documents",
        ),
        (
            "Gali ke ladkon ne mere bhai par lathi se hamla kiya aur maarpeet karke ghayal kar diya hospital me admit hai.",
            "Physical Assault",
        ),
        (
            "Construction workers next door are playing loud music with heavy drilling machines at 2 AM creating public nuisance.",
            "Other",
        ),
    ],
)
def test_ten_representative_multilingual_samples(text, expected_category):
    """Verify correct classification across English, Hindi, and Hinglish for all 7 classes."""
    res = predict_category(text)
    assert res["status"] == "success"
    assert res["predicted_category"] == expected_category, (
        f"Failed on sample '{text[:50]}...'. Expected {expected_category}, got {res['predicted_category']}"
    )


def test_cpu_inference_latency_benchmark():
    """Verify that inference latency is CPU-friendly and well under 500 ms."""
    sample_text = (
        "Yesterday around 8 PM my two wheeler vehicle Honda Activa was stolen outside the market. "
        "कल शाम बाजार से मेरी स्कूटी चोरी हो गई।"
    )

    # Warm-up call
    _ = predict_category(sample_text)

    # Benchmark 50 calls
    latencies = []
    for _ in range(50):
        t0 = time.perf_counter()
        res = predict_category(sample_text)
        t1 = time.perf_counter()
        assert res["status"] == "success"
        latencies.append(t1 - t0)

    mean_latency = sum(latencies) / len(latencies)
    max_latency = max(latencies)

    # CPU inference must be < 500ms (in practice it is ~1-5ms)
    assert mean_latency < 0.500, f"Mean latency {mean_latency*1000:.2f} ms exceeds 500 ms limit"
    assert max_latency < 0.500, f"Max latency {max_latency*1000:.2f} ms exceeds 500 ms limit"
