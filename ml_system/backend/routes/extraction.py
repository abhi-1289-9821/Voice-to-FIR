from fastapi import APIRouter, HTTPException
import logging

from backend.schemas.complaint import ExtractionRequest, ExtractionResponse
from nlp.entity_extraction import extract_entities

logger = logging.getLogger("ExtractionRouter")
router = APIRouter(prefix="/api", tags=["Entity Extraction"])


@router.post("/extract", response_model=ExtractionResponse)
async def extract_complaint_entities(request: ExtractionRequest):
    """
    Extract structured entities (PERSON, LOCATION, DATE, TIME, MONEY, PHONE, OBJECT)
    from complaint text using spaCy NER + deterministic multilingual rules.
    """
    try:
        result = extract_entities(request.complaint_text, language=request.language)
        return ExtractionResponse(**result)
    except Exception as e:
        logger.error(f"Entity extraction failed: {e}")
        raise HTTPException(status_code=500, detail="Entity extraction processing error occurred.")
