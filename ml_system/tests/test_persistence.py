import sys
from pathlib import Path
import pytest

sys.path.append(str(Path(__file__).resolve().parent.parent))

from backend.database.connection import init_db
from backend.schemas.complaint import (
    ComplaintCreateRequest,
    OfficerNoteCreateRequest,
    StatusUpdateRequest,
)
from backend.services import complaint_service


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    init_db()


def test_create_and_fetch_complaint():
    req = ComplaintCreateRequest(
        complainant_name="Aarav Mehta",
        complainant_phone="+91 98200 11223",
        complainant_email="aarav.mehta@example.com",
        complainant_address="Bandra West, Mumbai",
        incident_category="Theft / Stolen Property",
        predicted_category="Theft",
        model_confidence=0.892,
        incident_date="2026-11-20",
        incident_time="21:15",
        incident_location="Bandra Railway Station Platform 2",
        incident_landmark="Near Escalator 1",
        description="Black leather laptop bag containing Dell Latitude laptop stolen while boarding local train.",
        original_transcript="Black leather laptop bag stolen while boarding local train.",
        corrected_transcript="Black leather laptop bag containing Dell Latitude laptop stolen while boarding local train.",
        is_transcript_edited=True,
        priority="High",
        police_station="Bandra Police Station",
        extracted_entities={
            "LOCATION": ["Bandra Railway Station"],
            "DATE": ["2026-11-20"],
            "OBJECT": ["laptop bag", "Dell Latitude laptop"],
        },
    )

    created = complaint_service.create_complaint(req)
    assert created is not None
    assert created["referenceNumber"].startswith("AS-2026-")
    assert created["complainantName"] == "Aarav Mehta"
    assert created["status"] == "Pending Review"
    assert created["isTranscriptEdited"] is True
    assert len(created["timeline"]) >= 1
    assert "Bandra Railway Station" in created["incidentLocation"]

    ref = created["referenceNumber"]

    # Test retrieval by reference
    fetched = complaint_service.get_complaint_by_reference(ref)
    assert fetched is not None
    assert fetched["referenceNumber"] == ref
    assert fetched["description"] == req.description
    assert fetched["extractedEntities"]["OBJECT"] == ["laptop bag", "Dell Latitude laptop"]


def test_update_complaint_status_and_timeline():
    req = ComplaintCreateRequest(
        complainant_name="Pooja Verma",
        complainant_phone="+91 99112 33445",
        incident_category="Cybercrime / Online Fraud",
        predicted_category="Cyber Fraud",
        model_confidence=0.915,
        incident_date="2026-11-21",
        incident_time="11:30",
        incident_location="Online NetBanking / UPI",
        description="Received phishing SMS and lost Rs 35,000 via fraudulent UPI transaction.",
    )
    created = complaint_service.create_complaint(req)
    ref = created["referenceNumber"]

    # Update to Under Review
    status_req = StatusUpdateRequest(
        status="Under Review",
        actor="SI Rajesh Kumar",
        role="Police Officer",
        note="Phishing SMS headers analyzed and bank alerted for transaction freeze.",
    )
    updated = complaint_service.update_complaint_status(ref, status_req)
    assert updated is not None
    assert updated["status"] == "Under Review"

    # Verify timeline was appended
    timeline = complaint_service.get_timeline(ref)
    assert len(timeline) >= 2
    assert timeline[-1]["status"] == "Under Review"
    assert "SI Rajesh Kumar" in timeline[-1]["actor"]


def test_add_officer_case_note():
    req = ComplaintCreateRequest(
        complainant_name="Karan Malhotra",
        complainant_phone="+91 98111 22334",
        incident_category="Physical Assault / Harassment",
        incident_date="2026-11-22",
        incident_time="19:00",
        incident_location="Cyber Hub Parking",
        description="Verbal abuse and intimidation by two unknown individuals in parking lot.",
    )
    created = complaint_service.create_complaint(req)
    ref = created["referenceNumber"]

    note_req = OfficerNoteCreateRequest(
        officer_name="Inspector Vikram Singh",
        badge_number="DL-POLICE-099",
        note="CCTV footage of parking lot B-2 requested from mall security management.",
    )
    updated = complaint_service.add_officer_note(ref, note_req)
    assert updated is not None
    assert len(updated["officerNotes"]) >= 1
    assert updated["officerNotes"][0]["officerName"] == "Inspector Vikram Singh"
    assert "CCTV footage" in updated["officerNotes"][0]["note"]


def test_list_and_filter_complaints():
    all_cases = complaint_service.list_complaints()
    assert len(all_cases) >= 3

    # Filter by category
    cyber_cases = complaint_service.list_complaints(category="Cybercrime / Online Fraud")
    assert all(c["incidentCategory"] == "Cybercrime / Online Fraud" for c in cyber_cases)

    # Filter by search
    searched = complaint_service.list_complaints(search="Bandra")
    assert len(searched) >= 1
    assert any("Bandra" in c["incidentLocation"] for c in searched)


def test_nonexistent_reference_returns_none():
    result = complaint_service.get_complaint_by_reference("AS-2026-99999999")
    assert result is None
