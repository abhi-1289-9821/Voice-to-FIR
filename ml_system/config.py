import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent
DATASETS_DIR = BASE_DIR / "datasets"
RAW_DATA_DIR = DATASETS_DIR / "raw"
PROCESSED_DATA_DIR = DATASETS_DIR / "processed"

MODELS_DIR = BASE_DIR / "models"
CLASSIFIER_MODEL_DIR = MODELS_DIR / "complaint_classifier"
WHISPER_MODEL_DIR = MODELS_DIR / "speech_recognition"

EVALUATION_DIR = BASE_DIR / "evaluation"

# Classifier Settings
CATEGORIES = [
    "Theft",
    "Cyber Fraud",
    "Harassment",
    "Missing Person",
    "Lost Documents",
    "Physical Assault",
    "Other"
]

MODEL_ARTIFACTS = {
    "model_path": CLASSIFIER_MODEL_DIR / "complaint_classifier_lr.joblib",
    "vectorizer_path": CLASSIFIER_MODEL_DIR / "tfidf_vectorizer.joblib",
    "metadata_path": CLASSIFIER_MODEL_DIR / "model_metadata.json",
    "svm_model_path": CLASSIFIER_MODEL_DIR / "complaint_classifier_svm.joblib",
}

# Whisper Settings
WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "base")  # options: tiny, base, small
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

# API Settings
API_TITLE = "AwaazSetu ML/DL Engine"
API_VERSION = "1.0.0"
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]
