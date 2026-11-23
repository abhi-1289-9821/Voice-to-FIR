import io
import sys
import wave
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

sys.path.append(str(Path(__file__).resolve().parent.parent))

from backend.main import app


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "endpoints" in data
    assert "legal_notice" in data


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "complaint_classifier" in data["components"]
    assert "speech_recognition" in data["components"]


def test_models_status_endpoint(client):
    response = client.get("/api/models")
    assert response.status_code == 200
    data = response.json()
    assert "classifier" in data
    assert "speech_recognition" in data
    assert "nlp_extractor" in data
    assert data["classifier"]["status"] == "ready"
    assert len(data["classifier"]["classes"]) == 7


def test_evaluation_endpoint(client):
    response = client.get("/api/evaluation")
    assert response.status_code == 200
    data = response.json()
    assert "primary_model_metrics" in data
    assert "accuracy" in data["primary_model_metrics"]
    assert "confusion_matrix" in data["primary_model_metrics"]
    assert "speech_recognition_benchmark" in data


def test_classify_endpoint_theft(client):
    payload = {"complaint_text": "Someone broke into my car and stole my laptop at Indiranagar metro station."}
    response = client.post("/api/classify", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_category"] == "Theft"
    assert 0.0 <= data["confidence"] <= 1.0
    assert "class_probabilities" in data
    assert len(data["class_probabilities"]) == 7


def test_classify_endpoint_cyber_fraud(client):
    payload = {"complaint_text": "Clicked electricity bill link and 25000 rupees were debited via UPI."}
    response = client.post("/api/classify", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_category"] == "Cyber Fraud"


def test_extract_endpoint(client):
    payload = {
        "complaint_text": "Rohan Sharma lost his Aadhaar card at BDA Complex yesterday at 3 PM. Phone: 9876543210.",
        "language": "en"
    }
    response = client.post("/api/extract", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "extracted_entities" in data
    assert len(data["extracted_entities"]["PHONE"]) > 0
    assert len(data["extracted_entities"]["LOCATION"]) > 0


def test_analyze_full_pipeline(client):
    payload = {
        "complaint_text": "Three men assaulted me with wooden sticks near Commercial Street around 9 PM yesterday. Phone: 9988776655.",
        "language": "en",
        "complainant_name": "Aman Verma"
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["classification"]["predicted_category"] == "Physical Assault"
    assert data["structured_complaint"]["complaint_reference"].startswith("AS-2026-")
    assert "Commercial Street" in data["structured_complaint"]["incident_location"]
    assert "Aman Verma" in data["structured_complaint"]["involved_persons"]
    assert "FIR" in data["structured_complaint"]["legal_disclaimer"]


def test_transcribe_endpoint_empty_file_rejected(client):
    empty_file = io.BytesIO(b"")
    response = client.post(
        "/api/transcribe",
        files={"file": ("empty.wav", empty_file, "audio/wav")}
    )
    assert response.status_code == 400


def test_transcribe_endpoint_invalid_extension(client):
    fake_file = io.BytesIO(b"dummy text")
    response = client.post(
        "/api/transcribe",
        files={"file": ("malicious.exe", fake_file, "application/octet-stream")}
    )
    assert response.status_code == 400
    assert "Unsupported audio format" in response.json()["detail"]


def test_analyze_audio_endpoint_with_valid_wav(client):
    # Generate a valid tiny silent WAV buffer (1 second, 16kHz, 16-bit mono)
    wav_io = io.BytesIO()
    with wave.open(wav_io, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        wf.writeframes(b"\x00" * 32000)
    wav_io.seek(0)

    response = client.post(
        "/api/analyze-audio",
        files={"file": ("test_silence.wav", wav_io, "audio/wav")},
        data={"language": "en"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "transcription" in data
    assert data["transcription"]["duration_seconds"] > 0.0
