from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query

from backend.schemas.complaint import (
    ComplaintCreateRequest,
    ComplaintDetailResponse,
    OfficerNoteCreateRequest,
    StatusUpdateRequest,
    TimelineEventItem,
)
from backend.services import complaint_service

router = APIRouter(prefix="/api/complaints", tags=["Complaint Persistence & Case Management"])


@router.post("", response_model=ComplaintDetailResponse, status_code=201)
def create_complaint(req: ComplaintCreateRequest):
    """
    Persist a citizen-reviewed complaint into SQLite database.
    Generates an official demo reference number (e.g. AS-2026-XXXX) and initializes case timeline.
    """
    try:
        return complaint_service.create_complaint(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record complaint: {str(e)}")


@router.get("", response_model=List[ComplaintDetailResponse])
def list_complaints(
    status: Optional[str] = Query(None, description="Filter by status"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search term"),
):
    """
    Retrieve all registered complaints with optional filtering by status, category, or search query.
    Used by Complainant and Officer triage consoles.
    """
    try:
        return complaint_service.list_complaints(status=status, category=category, search=search)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch complaints: {str(e)}")


@router.get("/{reference}", response_model=ComplaintDetailResponse)
def get_complaint(reference: str):
    """
    Retrieve a single complaint factsheet and status timeline by reference number.
    """
    comp = complaint_service.get_complaint_by_reference(reference)
    if not comp:
        raise HTTPException(status_code=404, detail=f"Complaint with reference '{reference}' not found.")
    return comp


@router.patch("/{reference}/status", response_model=ComplaintDetailResponse)
def update_complaint_status(
    reference: str,
    req: StatusUpdateRequest,
):
    """
    Update complaint triage status (e.g., 'Under Review', 'Needs More Information', 'Closed (Prototype)').
    Appends an immutable entry to the case history timeline.
    """
    comp = complaint_service.update_complaint_status(reference, req)
    if not comp:
        raise HTTPException(status_code=404, detail=f"Complaint with reference '{reference}' not found.")
    return comp


@router.get("/{reference}/timeline", response_model=List[TimelineEventItem])
def get_complaint_timeline(reference: str):
    """
    Get chronological status history events for a complaint.
    """
    timeline = complaint_service.get_timeline(reference)
    if timeline is None:
        raise HTTPException(status_code=404, detail=f"Complaint with reference '{reference}' not found.")
    return timeline


@router.post("/{reference}/notes", response_model=ComplaintDetailResponse)
def add_officer_note(
    reference: str,
    req: OfficerNoteCreateRequest,
):
    """
    Add an official police officer case note to the complaint record.
    """
    comp = complaint_service.add_officer_note(reference, req)
    if not comp:
        raise HTTPException(status_code=404, detail=f"Complaint with reference '{reference}' not found.")
    return comp
