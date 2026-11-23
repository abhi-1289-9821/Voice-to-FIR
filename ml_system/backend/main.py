from contextlib import asynccontextmanager
import json
import logging
from pathlib import Path
from typing import Any, Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import sys
sys.path.append(str(Path(__file__).resolve().parent.parent))

from backend.database.connection import init_db
from backend.routes.analysis import router as analysis_router
from backend.routes.classification import router as classification_router
from backend.routes.complaints import router as complaints_router
from backend.routes.extraction import router as extraction_router
from backend.routes.transcription import router as transcription_router
from backend.schemas.complaint import HealthResponse, ModelStatusResponse
from config import API_TITLE, API_VERSION, CORS_ORIGINS, EVALUATION_DIR
from models.speech_recognition.whisper_engine import WhisperEngine
from training.predict import ComplaintClassifier

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("AwaazSetuBackend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Initialize SQLite database tables and pre-load machine learning models.
    """
    logger.info("Initializing SQLite database tables...")
    try:
        init_db()
        logger.info("SQLite database tables initialized.")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")

    logger.info("Starting AwaazSetu ML/DL Engine. Pre-loading models...")
    try:
        classifier = ComplaintClassifier.get_instance()
        logger.info(f"Loaded classifier: {classifier.model_type} ({len(classifier.classes)} classes)")
    except Exception as e:
        logger.warning(f"ComplaintClassifier pre-load warning: {e}")

    try:
        whisper_eng = WhisperEngine.get_instance()
        logger.info(f"WhisperEngine status: {whisper_eng.get_status()['status']}")
    except Exception as e:
        logger.warning(f"WhisperEngine pre-load warning: {e}")

    yield

    logger.info("Shutting down AwaazSetu ML/DL Engine.")


app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description="Independent Machine Learning, Deep Learning, and NLP Engine for AwaazSetu",
    lifespan=lifespan,
)

# Enable CORS for the existing Vite frontend's development origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount modular routers
app.include_router(classification_router)
app.include_router(extraction_router)
app.include_router(transcription_router)
app.include_router(analysis_router)
app.include_router(complaints_router)


@app.get("/", tags=["General"])
async def root():
    return {
        "service": API_TITLE,
        "version": API_VERSION,
        "description": "AwaazSetu Independent ML/DL & NLP Engine",
        "documentation": "/docs",
        "endpoints": {
            "health": "/health",
            "models_status": "/api/models",
            "evaluation_metrics": "/api/evaluation",
            "classify": "/api/classify",
            "extract_entities": "/api/extract",
            "analyze_text": "/api/analyze",
            "transcribe_audio": "/api/transcribe",
            "analyze_audio": "/api/analyze-audio",
            "complaints": "/api/complaints",
        },
        "legal_notice": "Academic prototype. Assists complaint intake and review. Does not legally register an FIR.",
    }


@app.get("/health", response_model=HealthResponse, tags=["General"])
async def health_check():
    classifier_ready = False
    try:
        c = ComplaintClassifier.get_instance()
        classifier_ready = c.model is not None
    except Exception:
        classifier_ready = False

    whisper_status = "unavailable"
    try:
        w = WhisperEngine.get_instance()
        whisper_status = w.get_status()["status"]
    except Exception:
        whisper_status = "error"

    return HealthResponse(
        status="healthy",
        service=API_TITLE,
        version=API_VERSION,
        models_ready=classifier_ready,
        components={
            "complaint_classifier": "ready" if classifier_ready else "not_loaded",
            "speech_recognition": whisper_status,
            "entity_extractor": "ready",
            "missing_information_detector": "ready",
        },
    )


@app.get("/api/models", response_model=ModelStatusResponse, tags=["General"])
async def get_models_status():
    classifier = ComplaintClassifier.get_instance()
    whisper_eng = WhisperEngine.get_instance()

    return ModelStatusResponse(
        classifier={
            "model_name": classifier.metadata.get("model_name", "TF-IDF + Logistic Regression"),
            "classes": classifier.classes,
            "num_classes": len(classifier.classes),
            "test_accuracy": classifier.metadata.get("test_accuracy"),
            "test_f1_weighted": classifier.metadata.get("test_f1_weighted"),
            "status": "ready" if classifier.model else "not_loaded",
        },
        speech_recognition=whisper_eng.get_status(),
        nlp_extractor={
            "engine": "spaCy NER + Deterministic Multilingual Rules",
            "supported_entities": ["PERSON", "LOCATION", "DATE", "TIME", "MONEY", "PHONE", "OBJECT"],
            "languages": ["English", "Hindi"],
            "status": "ready",
        },
    )


@app.get("/api/evaluation", tags=["Evaluation"])
async def get_evaluation_metrics():
    """Return actual held-out test evaluation report and benchmark metrics."""
    report_file = EVALUATION_DIR / "evaluation_report.json"
    if not report_file.exists():
        raise HTTPException(status_code=404, detail="Evaluation report not found. Run evaluate_classifier.py.")

    with open(report_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data


# Global Exception Handler preventing sensitive internal path leaks
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal service error occurred. Please verify your input parameters."},
    )
