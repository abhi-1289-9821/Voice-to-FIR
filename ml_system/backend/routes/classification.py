from fastapi import APIRouter, HTTPException
import logging

from backend.schemas.complaint import ClassificationRequest, ClassificationResponse
from training.predict import predict_category

logger = logging.getLogger("ClassificationRouter")
router = APIRouter(prefix="/api", tags=["Classification"])


@router.post("/classify", response_model=ClassificationResponse)
async def classify_complaint(request: ClassificationRequest):
    """
    Classify raw complaint text into one of 7 standard categories
    using the locally trained TF-IDF + Logistic Regression model.
    Returns predicted category, true model class probabilities, and confidence score.
    """
    try:
        result = predict_category(request.complaint_text)
        return ClassificationResponse(**result)
    except Exception as e:
        logger.error(f"Classification failed: {e}")
        raise HTTPException(status_code=500, detail="Model inference error occurred.")
