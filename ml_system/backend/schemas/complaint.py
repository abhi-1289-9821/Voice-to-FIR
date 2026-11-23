from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ClassificationRequest(BaseModel):
    complaint_text: str = Field(..., min_length=1, description="Raw text of the incident complaint")


class ClassificationResponse(BaseModel):
    predicted_category: str
    class_probabilities: Dict[str, float]
    confidence: float
    model_name: str
    cleaned_text: str
    status: str


class ExtractionRequest(BaseModel):
    complaint_text: str = Field(..., min_length=1, description="Complaint text for NLP entity extraction")
    language: Optional[str] = Field("en", description="Optional language hint ('en' or 'hi')")


class ExtractionResponse(BaseModel):
    extracted_entities: Dict[str, List[str]]
    available_fields: List[str]
    missing_fields: List[str]
    extraction_method: str


class AnalysisRequest(BaseModel):
    complaint_text: str = Field(..., min_length=1, description="Complainant narrative or speech transcript")
    language: Optional[str] = Field("en", description="Language hint ('en' or 'hi')")
    complainant_name: Optional[str] = Field(None, description="Optional legal name of complainant")
    complainant_phone: Optional[str] = Field(None, description="Optional contact phone number")


class StructuredComplaint(BaseModel):
    complaint_reference: str
    incident_category: str
    classification_confidence: float
    original_transcript: str
    corrected_transcript: str
    incident_summary: str
    incident_date: Optional[str] = None
    incident_time: Optional[str] = None
    incident_location: str
    involved_persons: List[str]
    reported_loss: Optional[str] = None
    extracted_entities: Dict[str, List[str]]
    missing_information: Dict[str, Any]
    verification_status: str
    legal_disclaimer: str


class AnalysisResponse(BaseModel):
    classification: ClassificationResponse
    extraction: ExtractionResponse
    missing_information: Dict[str, Any]
    structured_complaint: StructuredComplaint
    status: str


class TranscriptionSegment(BaseModel):
    id: int
    start: float
    end: float
    text: str


class TranscriptionResponse(BaseModel):
    transcript: str
    detected_language: Optional[str] = None
    language_probability: float = 0.0
    duration_seconds: float = 0.0
    segments: List[TranscriptionSegment] = []
    processing_time: float
    status: str
    error_message: Optional[str] = None


class AudioAnalysisResponse(BaseModel):
    transcription: TranscriptionResponse
    analysis: Optional[AnalysisResponse] = None
    status: str


class ModelStatusResponse(BaseModel):
    classifier: Dict[str, Any]
    speech_recognition: Dict[str, Any]
    nlp_extractor: Dict[str, Any]


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    models_ready: bool
    components: Dict[str, str]
