import time
from typing import Any, Dict, List, Optional

# Predefined follow-up question templates for each field by category (Deterministic, No LLM)
QUESTION_TEMPLATES = {
    "exact_location": {
        "en": "Could you provide the exact landmark, metro gate, or street name where the incident occurred?",
        "hi": "क्या आप उस सटीक स्थान, लैंडमार्क या मेट्रो गेट का नाम बता सकते हैं जहां यह घटना घटी?",
    },
    "incident_date": {
        "en": "On what date did this incident take place?",
        "hi": "यह घटना किस तारीख को हुई थी?",
    },
    "incident_time": {
        "en": "Approximately what time did this occur (e.g., morning 10 AM, 6:45 PM)?",
        "hi": "यह घटना लगभग किस समय घटी (जैसे सुबह 10 बजे, शाम 6:45)?",
    },
    "property_details": {
        "en": "Please specify the brand, model, color, or serial number of the stolen item.",
        "hi": "कृपया चोरी हुए सामान का ब्रांड, मॉडल, रंग या सीरियल नंबर दर्ज करें।",
    },
    "transaction_details": {
        "en": "Please provide the reported transaction amount, bank name, and UPI / UTR reference number.",
        "hi": "कृपया बैंक का नाम, लेन-देन की राशि और यूपीआई / यूटीआर संदर्भ संख्या प्रदान करें।",
    },
    "suspect_details": {
        "en": "Do you have the phone number, vehicle registration, or physical description of the suspect?",
        "hi": "क्या आपके पास संदिग्ध व्यक्ति का फोन नंबर, गाड़ी नंबर या हुलिया विवरण है?",
    },
    "missing_person_details": {
        "en": "Please provide the missing person's full name, approximate age, height, and clothing last seen wearing.",
        "hi": "कृपया लापता व्यक्ति का पूरा नाम, उम्र, कद और पहने हुए कपड़ों का विवरण बताएं।",
    },
    "document_details": {
        "en": "Which specific document was lost (e.g., Aadhaar, PAN, Passport, Driving Licence) and what is its number if known?",
        "hi": "कौन सा दस्तावेज खोया है (जैसे आधार, पैन, पासपोर्ट, ड्राइविंग लाइसेंस) और यदि याद हो तो उसका नंबर क्या है?",
    },
    "injury_details": {
        "en": "Were any weapons used (sticks, rods, sharp objects) and did anyone sustain physical injuries requiring medical treatment?",
        "hi": "क्या किसी हथियार (लाठी, रॉड, धारदार वस्तु) का प्रयोग हुआ था और क्या किसी को अस्पताल में इलाज की आवश्यकता पड़ी?",
    },
    "contact_phone": {
        "en": "Please provide a contact phone number where the investigating officer can reach you.",
        "hi": "कृपया एक संपर्क फोन नंबर दर्ज करें जिस पर जांच अधिकारी आपसे संपर्क कर सकें।",
    },
}

# Required critical information checklist by complaint category
CATEGORY_REQUIREMENTS = {
    "Theft": {
        "required": ["exact_location", "incident_date", "property_details"],
        "recommended": ["incident_time", "contact_phone"],
    },
    "Cyber Fraud": {
        "required": ["transaction_details", "incident_date"],
        "recommended": ["suspect_details", "contact_phone"],
    },
    "Harassment": {
        "required": ["suspect_details", "incident_date"],
        "recommended": ["exact_location", "contact_phone"],
    },
    "Missing Person": {
        "required": ["missing_person_details", "exact_location", "incident_date"],
        "recommended": ["incident_time", "contact_phone"],
    },
    "Lost Documents": {
        "required": ["document_details", "exact_location", "incident_date"],
        "recommended": ["contact_phone"],
    },
    "Physical Assault": {
        "required": ["exact_location", "incident_date", "injury_details"],
        "recommended": ["suspect_details", "incident_time", "contact_phone"],
    },
    "Other": {
        "required": ["exact_location", "incident_date"],
        "recommended": ["contact_phone"],
    },
}


class MissingInformationDetector:
    def detect(
        self,
        category: str,
        extracted_entities: Dict[str, List[str]],
        language: str = "en",
    ) -> Dict[str, Any]:
        """
        Deterministically evaluates whether essential facts are present or missing
        based on the specific complaint category.
        """
        req_spec = CATEGORY_REQUIREMENTS.get(category, CATEGORY_REQUIREMENTS["Other"])
        required_fields = req_spec["required"]
        recommended_fields = req_spec["recommended"]

        # Map entities to semantic field availability
        available_fields: List[str] = []
        missing_fields: List[str] = []
        follow_up_questions: List[str] = []

        # Location check
        if len(extracted_entities.get("LOCATION", [])) > 0:
            available_fields.append("exact_location")
        else:
            if "exact_location" in required_fields:
                missing_fields.append("exact_location")

        # Date check
        if len(extracted_entities.get("DATE", [])) > 0:
            available_fields.append("incident_date")
        else:
            if "incident_date" in required_fields:
                missing_fields.append("incident_date")

        # Time check
        if len(extracted_entities.get("TIME", [])) > 0:
            available_fields.append("incident_time")
        else:
            if "incident_time" in required_fields:
                missing_fields.append("incident_time")

        # Phone check
        if len(extracted_entities.get("PHONE", [])) > 0:
            available_fields.append("contact_phone")
        else:
            if "contact_phone" in required_fields:
                missing_fields.append("contact_phone")

        # Category-specific entity checks
        if category == "Theft":
            if len(extracted_entities.get("OBJECT", [])) > 0:
                available_fields.append("property_details")
            else:
                missing_fields.append("property_details")

        elif category == "Cyber Fraud":
            if len(extracted_entities.get("MONEY", [])) > 0:
                available_fields.append("transaction_details")
            else:
                missing_fields.append("transaction_details")

        elif category == "Lost Documents":
            # Check if any document object is identified
            doc_objs = [o for o in extracted_entities.get("OBJECT", []) if any(d in o.lower() for d in ["card", "passport", "licence", "license", "rc", "marksheet", "deed", "पासपोर्ट", "आधार", "पैन"])]
            if doc_objs:
                available_fields.append("document_details")
            else:
                missing_fields.append("document_details")

        elif category == "Missing Person":
            if len(extracted_entities.get("PERSON", [])) > 0:
                available_fields.append("missing_person_details")
            else:
                missing_fields.append("missing_person_details")

        elif category == "Physical Assault":
            # Look for weapon / violence keywords in text
            if len(extracted_entities.get("OBJECT", [])) > 0 or len(extracted_entities.get("PERSON", [])) > 0:
                available_fields.append("injury_details")
            else:
                missing_fields.append("injury_details")

        elif category == "Harassment":
            if len(extracted_entities.get("PERSON", [])) > 0 or len(extracted_entities.get("PHONE", [])) > 0:
                available_fields.append("suspect_details")
            else:
                missing_fields.append("suspect_details")

        # Generate deterministic follow-up questions for missing fields
        lang_key = "hi" if language and language.lower().startswith("hi") else "en"
        for field in missing_fields:
            if field in QUESTION_TEMPLATES:
                follow_up_questions.append(QUESTION_TEMPLATES[field][lang_key])

        completeness_score = round(
            len(available_fields) / float(len(required_fields) + len(recommended_fields)), 2
        )

        return {
            "category": category,
            "completeness_score": min(completeness_score, 1.0),
            "available_fields": list(dict.fromkeys(available_fields)),
            "missing_fields": list(dict.fromkeys(missing_fields)),
            "follow_up_questions": follow_up_questions,
            "is_ready_for_review": len(missing_fields) == 0,
        }


def detect_missing_information(
    category: str,
    extracted_entities: Dict[str, List[str]],
    language: str = "en",
) -> Dict[str, Any]:
    detector = MissingInformationDetector()
    return detector.detect(category, extracted_entities, language=language)


def generate_structured_complaint(
    transcript: str,
    category: str,
    confidence: float,
    extracted_entities: Dict[str, List[str]],
    missing_info: Dict[str, Any],
    complainant_name: Optional[str] = None,
    complainant_phone: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Module 5: Deterministic Structured Complaint Generation.
    Faithfully organizes complainant facts without generative embellishment or LLM hallucination.
    """
    ref_id = f"AS-2026-{int(time.time()) % 10000:04d}"

    # Safe extraction of primary attributes (robust against empty list values)
    dates = extracted_entities.get("DATE") or []
    date_val = dates[0] if len(dates) > 0 else None

    times = extracted_entities.get("TIME") or []
    time_val = times[0] if len(times) > 0 else None

    locations = extracted_entities.get("LOCATION") or []
    loc_val = ", ".join(locations) if len(locations) > 0 else "Location not specified"

    persons_val = list(extracted_entities.get("PERSON") or [])
    if complainant_name and complainant_name not in persons_val:
        persons_val.insert(0, complainant_name)

    losses = extracted_entities.get("MONEY") or []
    loss_val = ", ".join(losses) if len(losses) > 0 else None

    objects_val = list(extracted_entities.get("OBJECT") or [])

    # Template-based factual summary (Strictly no generative fabrication)
    summary_parts = [f"Complaint regarding reported {category}."]
    if loc_val and loc_val != "Location not specified":
        summary_parts.append(f"Occurred in the vicinity of {loc_val}.")
    if date_val:
        summary_parts.append(f"Reported incident date: {date_val}.")
    if time_val:
        summary_parts.append(f"Approximate incident time: {time_val}.")
    if objects_val:
        summary_parts.append(f"Involved items/property: {', '.join(objects_val)}.")
    if loss_val:
        summary_parts.append(f"Reported monetary loss: {loss_val}.")

    incident_summary = " ".join(summary_parts)

    return {
        "complaint_reference": ref_id,
        "incident_category": category,
        "classification_confidence": round(confidence, 4),
        "original_transcript": transcript,
        "corrected_transcript": transcript,  # Human-editable in downstream review
        "incident_summary": incident_summary,
        "incident_date": date_val,
        "incident_time": time_val,
        "incident_location": loc_val,
        "involved_persons": persons_val,
        "reported_loss": loss_val,
        "extracted_entities": extracted_entities,
        "missing_information": missing_info,
        "verification_status": "Pending Station Officer Review",
        "legal_disclaimer": (
            "ACADEMIC PROTOTYPE NOTICE: AwaazSetu provides AI-assisted complaint drafting for "
            "police review. This generated document does not register a legally valid First Information Report (FIR) "
            "and does not replace an authorized Station House Officer (SHO)."
        ),
    }
