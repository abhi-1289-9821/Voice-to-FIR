from fastapi import APIRouter, File, Form, HTTPException, UploadFile
import logging
from typing import Optional

from backend.schemas.complaint import (
    AnalysisRequest,
    AnalysisResponse,
    AudioAnalysisResponse,
    ClassificationResponse,
    ExtractionResponse,
    StructuredComplaint,
    TranscriptionResponse,
)
from models.speech_recognition.whisper_engine import transcribe_audio
from nlp.entity_extraction import extract_entities
from nlp.missing_information import detect_missing_information, generate_structured_complaint
from training.predict import predict_category

logger = logging.getLogger("AnalysisRouter")
router = APIRouter(prefix="/api", tags=["Full Complaint Analysis"])


def _run_pipeline(
    text: str,
    language: Optional[str] = "en",
    complainant_name: Optional[str] = None,
    complainant_phone: Optional[str] = None,
) -> AnalysisResponse:
    # 1. Category Classification
    cls_res = predict_category(text)

    # 2. Entity Extraction
    ext_res = extract_entities(text, language=language)

    # 3. Missing Information Detection
    miss_res = detect_missing_information(
        cls_res["predicted_category"], ext_res["extracted_entities"], language=language or "en"
    )

    # 4. Structured Complaint Generation
    struct_comp = generate_structured_complaint(
        transcript=text,
        category=cls_res["predicted_category"],
        confidence=cls_res["confidence"],
        extracted_entities=ext_res["extracted_entities"],
        missing_info=miss_res,
        complainant_name=complainant_name,
        complainant_phone=complainant_phone,
    )

    return AnalysisResponse(
        classification=ClassificationResponse(**cls_res),
        extraction=ExtractionResponse(**ext_res),
        missing_information=miss_res,
        structured_complaint=StructuredComplaint(**struct_comp),
        status="success",
    )


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_text_complaint(request: AnalysisRequest):
    """
    End-to-end complaint analysis on raw text or speech transcript:
    1. ML Category Classification (TF-IDF + Logistic Regression)
    2. NLP Information Extraction (Entities & Identifiers)
    3. Deterministic Missing Information Detection & Follow-up Questions
    4. Structured Non-Legal Complaint Draft Generation
    """
    try:
        return _run_pipeline(
            text=request.complaint_text,
            language=request.language,
            complainant_name=request.complainant_name,
            complainant_phone=request.complainant_phone,
        )
    except Exception as e:
        logger.error(f"Analysis pipeline error: {e}")
        raise HTTPException(status_code=500, detail="Complaint analysis pipeline error.")


@router.post("/analyze-audio", response_model=AudioAnalysisResponse)
async def analyze_audio_complaint(
    file: UploadFile = File(..., description="Audio recording of the complaint"),
    language: Optional[str] = Form(None, description="Optional language hint ('en' or 'hi')"),
    complainant_name: Optional[str] = Form(None),
    complainant_phone: Optional[str] = Form(None),
):
    """
    Complete Audio Pipeline:
    1. Speech-to-Text transcription via faster-whisper.
    2. Category classification.
    3. Entity extraction.
    4. Missing information detection.
    5. Structured complaint generation.
    """
    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")

        # 1. Transcribe
        trans_res = transcribe_audio(content, language=language)
        transcription_resp = TranscriptionResponse(**trans_res)

        # 2. If transcription yielded text, feed into analysis pipeline
        analysis_resp = None
        if trans_res.get("transcript"):
            analysis_resp = _run_pipeline(
                text=trans_res["transcript"],
                language=trans_res.get("detected_language") or language or "en",
                complainant_name=complainant_name,
                complainant_phone=complainant_phone,
            )

        return AudioAnalysisResponse(
            transcription=transcription_resp,
            analysis=analysis_resp,
            status="success" if analysis_resp else "transcription_only",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Audio analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Complete audio analysis failed: {str(e)}")
