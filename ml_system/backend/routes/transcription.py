from fastapi import APIRouter, File, Form, HTTPException, UploadFile
import logging
from typing import Optional

from backend.schemas.complaint import TranscriptionResponse
from models.speech_recognition.whisper_engine import transcribe_audio

logger = logging.getLogger("TranscriptionRouter")
router = APIRouter(prefix="/api", tags=["Speech Recognition"])

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".ogg", ".webm", ".flac", ".aac"}
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_complaint_audio(
    file: UploadFile = File(..., description="Audio recording file (WAV, MP3, M4A, etc.)"),
    language: Optional[str] = Form(None, description="Optional language code ('en' or 'hi')"),
):
    """
    Speech-to-Text transcription endpoint powered by pretrained Whisper via faster-whisper.
    Supports Hindi and English audio, segment timestamps, language detection, and processing time.
    """
    filename = file.filename or "recording.wav"
    ext = "." + filename.split(".")[-1].lower() if "." in filename else ""

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")

        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(status_code=400, detail="Audio file exceeds 25 MB maximum allowed limit.")

        result = transcribe_audio(content, language=language)
        return TranscriptionResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail="Speech-to-text processing failed.")
