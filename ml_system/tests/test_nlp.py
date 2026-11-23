import pytest
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from nlp.text_preprocessing import clean_text, preprocess_for_tfidf
from nlp.entity_extraction import extract_entities
from nlp.missing_information import detect_missing_information, generate_structured_complaint


def test_text_cleaning():
    raw = "  Hello \t\t Rs. 5000 / rupees deducted   "
    cleaned = clean_text(raw)
    assert "₹" in cleaned
    assert "\t" not in cleaned


def test_entity_extraction_comprehensive():
    sample = (
        "Mr. Rohan Sharma reported his Wildcraft backpack and Lenovo ThinkPad laptop were stolen at "
        "Indiranagar Metro Station yesterday around 6:45 PM. Phone: +91 9876543210. Loss: 55000 rupees."
    )
    res = extract_entities(sample)
    entities = res["extracted_entities"]

    assert "Wildcraft Backpack" in entities["OBJECT"] or "Laptop" in entities["OBJECT"] or "Lenovo Thinkpad" in entities["OBJECT"]
    assert any("Metro Station" in loc or "Indiranagar" in loc for loc in entities["LOCATION"])
    assert len(entities["PHONE"]) > 0
    assert "9876543210" in entities["PHONE"][0]
    assert len(entities["DATE"]) > 0
    assert len(entities["TIME"]) > 0
    assert len(entities["MONEY"]) > 0


def test_hindi_entity_extraction():
    sample = "कल शाम 6 बजे कमर्शियल स्ट्रीट पर मेरा पर्स खो गया जिसमें 5000 रुपये थे।"
    res = extract_entities(sample)
    entities = res["extracted_entities"]
    assert len(entities["DATE"]) > 0
    assert len(entities["MONEY"]) > 0


def test_missing_information_detection():
    # Incomplete theft report (no location or time specified)
    sample_entities = {
        "OBJECT": ["Laptop"],
        "LOCATION": [],
        "DATE": [],
        "TIME": [],
        "MONEY": [],
        "PHONE": ["9876543210"],
        "PERSON": [],
    }
    missing_res = detect_missing_information("Theft", sample_entities)
    assert "exact_location" in missing_res["missing_fields"]
    assert "incident_date" in missing_res["missing_fields"]
    assert len(missing_res["follow_up_questions"]) >= 2
    assert missing_res["is_ready_for_review"] is False


def test_structured_complaint_generation():
    sample_entities = {
        "OBJECT": ["Honda Activa"],
        "LOCATION": ["Commercial Street"],
        "DATE": ["yesterday"],
        "TIME": ["8:30 PM"],
        "MONEY": [],
        "PHONE": ["9740088991"],
        "PERSON": ["Zameer"],
    }
    missing_res = detect_missing_information("Theft", sample_entities)
    complaint = generate_structured_complaint(
        transcript="My Honda Activa was stolen at Commercial Street yesterday at 8:30 PM.",
        category="Theft",
        confidence=0.88,
        extracted_entities=sample_entities,
        missing_info=missing_res,
        complainant_name="Mohammed Zameer"
    )

    assert complaint["complaint_reference"].startswith("AS-2026-")
    assert complaint["incident_category"] == "Theft"
    assert complaint["incident_date"] == "yesterday"
    assert "Commercial Street" in complaint["incident_location"]
    assert "FIR" in complaint["legal_disclaimer"]
    assert complaint["verification_status"] == "Pending Station Officer Review"
