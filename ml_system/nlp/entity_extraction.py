import re
from typing import Any, Dict, List, Optional, Set

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from nlp.text_preprocessing import clean_text, normalize_unicode

# Try loading spaCy safely; fall back gracefully if not available on host
SPACY_NLP = None
try:
    import spacy
    try:
        SPACY_NLP = spacy.load("en_core_web_sm")
    except Exception:
        SPACY_NLP = None
except Exception:
    SPACY_NLP = None


# Comprehensive Regex & Keyword Rule Patterns for English and Hindi/Hinglish
PHONE_REGEX = re.compile(r"(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b")

# Monetary amounts in English, Hindi and digits
MONEY_REGEX = re.compile(
    r"(?:₹\s*[\d,]+(?:\.\d+)?|\b(?:rs\.?|inr|rupees?)\s*[\d,]+(?:\.\d+)?|[\d,]+(?:\.\d+)?\s*(?:rupees?|रुपये|रुपए|हजार|लाख|lakh|crore|कटा|काटे)?(?=\s|[^\w\u0900-\u097F]|$)|(?:रुपये|रुपए)\s*[\d,]+)",
    re.IGNORECASE,
)

# Date patterns (standard dates, relative days in English and Hindi)
DATE_REGEX = re.compile(
    r"\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}(?:st|nd|rd|th)?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+\d{2,4})?|yesterday|today|last\s+(?:night|week|sunday|monday|tuesday|wednesday|thursday|friday|saturday)|कल|आज|परसों|रविवार|सोमवार|मंगलवार|बुधवार|गुरुवार|शुक्रवार|शनिवार)\b",
    re.IGNORECASE,
)

# Time patterns (12h, 24h, Hindi time words)
TIME_REGEX = re.compile(
    r"\b(?:\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?m\.?)?|\d{1,2}\s*[ap]\.?m\.?|midnight|noon|(?:सुबह|दोपहर|शाम|रात)\s*\d{1,2}(?::\d{2})?\s*बजे|around\s+\d{1,2}\s*(?:o'clock|[ap]\.?m\.?))\b",
    re.IGNORECASE,
)

# Indian honorifics and Person naming patterns
PERSON_TITLE_REGEX = re.compile(
    r"\b(?:mr\.?|mrs\.?|ms\.?|shri|smt\.?|dr\.?|constable|inspector|officer|advocate)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b",
    re.IGNORECASE,
)

# Location indicators (English & Hindi keywords + nearby terms)
LOCATION_KEYWORDS = [
    "metro station", "railway station", "bus stand", "bus stop", "market",
    "mall", "apartments", "apartment", "complex", "street", "road", "cross",
    "stage", "layout", "sector", "block", "nagar", "colony", "gate",
    "kiosk", "parking", "counter", "indiranagar", "koramangala", "jayanagar",
    "bellandur", "whitefield", "frazer town", "hsr layout", "bengaluru", "bangalore",
    "दिल्ली", "बेंगलुरु", "स्टेशन", "सड़क", "बाजार", "गली", "कॉलोनी", "दुकान", "मंडी", "पार्किंग"
]

# Objects frequently involved in complaints
KNOWN_OBJECTS = [
    # Electronics
    "laptop", "lenovo thinkpad", "dell monitor", "hp pavilion", "iphone", "mobile phone", "smartphone",
    "camera", "watch", "wristwatch", "tablet", "charger",
    # Vehicles
    "honda activa", "scooter", "motorcycle", "bike", "bicycle", "cycle", "maruti swift", "car", "auto",
    "activa 6g", "pulsar", "hero splendor",
    # Documents
    "aadhaar card", "pan card", "passport", "driving licence", "rc book", "registration certificate",
    "voter id", "cheque book", "marks card", "marksheet", "degree certificate", "sale deed", "ration card",
    "आधार कार्ड", "पैन कार्ड", "पासपोर्ट", "लाइसेंस", "आरसी",
    # Bags & Valuables
    "wildcraft backpack", "backpack", "bag", "wallet", "purse", "gold chain", "gold ring",
    "jewelry", "cash", "luggage", "suitcase", "बैग", "पर्स", "चेन", "गहने"
]


class EntityExtractor:
    def __init__(self):
        self.spacy_nlp = SPACY_NLP

    def extract(self, text: str, language: Optional[str] = None) -> Dict[str, Any]:
        """
        Extract structured entities from complaint text using spaCy NER + deterministic rules.
        Preserves original text, identifies missing fields, and never invents values.
        """
        if not text or not text.strip():
            return {
                "extracted_entities": {
                    "PERSON": [],
                    "LOCATION": [],
                    "DATE": [],
                    "TIME": [],
                    "MONEY": [],
                    "PHONE": [],
                    "OBJECT": [],
                },
                "available_fields": [],
                "missing_fields": ["PERSON", "LOCATION", "DATE", "TIME", "MONEY", "PHONE", "OBJECT"],
                "extraction_method": "none",
            }

        cleaned = normalize_unicode(text)
        entities: Dict[str, List[str]] = {
            "PERSON": [],
            "LOCATION": [],
            "DATE": [],
            "TIME": [],
            "MONEY": [],
            "PHONE": [],
            "OBJECT": [],
        }

        extraction_method = "deterministic_multilingual_rules"

        # 1. Use spaCy NER if available for English entities
        if self.spacy_nlp is not None:
            try:
                doc = self.spacy_nlp(cleaned)
                extraction_method = "spacy+deterministic_rules"
                for ent in doc.ents:
                    val = ent.text.strip()
                    if ent.label_ == "PERSON" and val not in entities["PERSON"]:
                        # Exclude obvious non-person tokens
                        if len(val.split()) <= 4 and not any(k in val.lower() for k in ["metro", "station", "road", "activa"]):
                            entities["PERSON"].append(val)
                    elif ent.label_ in ["GPE", "LOC", "FAC"] and val not in entities["LOCATION"]:
                        entities["LOCATION"].append(val)
                    elif ent.label_ == "DATE" and val not in entities["DATE"]:
                        entities["DATE"].append(val)
                    elif ent.label_ == "TIME" and val not in entities["TIME"]:
                        entities["TIME"].append(val)
                    elif ent.label_ == "MONEY" and val not in entities["MONEY"]:
                        entities["MONEY"].append(val)
            except Exception:
                pass

        # 2. Deterministic Regex: Phone Numbers
        for m in PHONE_REGEX.finditer(cleaned):
            val = m.group(0).strip()
            if val not in entities["PHONE"]:
                entities["PHONE"].append(val)

        # 3. Deterministic Regex: Money / Amounts
        for m in MONEY_REGEX.finditer(cleaned):
            val = m.group(0).strip()
            if val not in entities["MONEY"]:
                entities["MONEY"].append(val)

        # 4. Deterministic Regex: Dates
        for m in DATE_REGEX.finditer(cleaned):
            val = m.group(0).strip()
            if val not in entities["DATE"]:
                entities["DATE"].append(val)

        # 5. Deterministic Regex: Times
        for m in TIME_REGEX.finditer(cleaned):
            val = m.group(0).strip()
            if val not in entities["TIME"]:
                entities["TIME"].append(val)

        # 6. Deterministic Regex: Person Honorifics
        for m in PERSON_TITLE_REGEX.finditer(cleaned):
            val = m.group(1).strip()
            if val and val not in entities["PERSON"]:
                entities["PERSON"].append(val)

        # Hindi Person patterns (e.g., 'श्री ... जी', 'पिताजी ...', 'भाई ...')
        hindi_person_match = re.findall(r"(?:श्री|श्रीमती|भाई|बहन|भतीजा|पिता|दादाजी)\s+([A-Za-z\u0900-\u097F]+)", cleaned)
        for val in hindi_person_match:
            val = val.strip()
            if val and val not in entities["PERSON"] and len(val) > 2:
                entities["PERSON"].append(val)

        # 7. Deterministic Regex & Context Search: Locations
        lower_text = cleaned.lower()
        for loc_kw in LOCATION_KEYWORDS:
            if loc_kw in lower_text:
                # Capture surrounding phrase if possible (e.g. "Indiranagar Metro Station", "Commercial Street")
                pattern = rf"([A-Za-z0-9\s,\-'\u0900-\u097F]{{0,25}}{re.escape(loc_kw)}[A-Za-z0-9\s,\-'\u0900-\u097F]{{0,20}})"
                matches = re.findall(pattern, cleaned, re.IGNORECASE)
                for match in matches:
                    cand = clean_text(match, preserve_case=True)
                    if cand and len(cand) > 3 and not any(cand in existing for existing in entities["LOCATION"]):
                        entities["LOCATION"].append(cand)
                if not any(loc_kw in l.lower() for l in entities["LOCATION"]):
                    entities["LOCATION"].append(loc_kw.title())

        # Clean duplicates in locations
        entities["LOCATION"] = list(dict.fromkeys(entities["LOCATION"]))[:4]

        # 8. Deterministic Search: Known Objects
        for obj in KNOWN_OBJECTS:
            if re.search(rf"\b{re.escape(obj)}\b", lower_text):
                # Capitalize nicely
                proper_obj = obj.title() if obj.isascii() else obj
                if proper_obj not in entities["OBJECT"]:
                    entities["OBJECT"].append(proper_obj)

        # Filter out sub-matches / deduplicate
        for k in entities:
            entities[k] = list(dict.fromkeys(entities[k]))

        # Calculate available vs missing fields
        available = [k for k, v in entities.items() if len(v) > 0]
        missing = [k for k, v in entities.items() if len(v) == 0]

        return {
            "extracted_entities": entities,
            "available_fields": available,
            "missing_fields": missing,
            "extraction_method": extraction_method,
        }


_extractor_instance = None

def get_entity_extractor() -> EntityExtractor:
    global _extractor_instance
    if _extractor_instance is None:
        _extractor_instance = EntityExtractor()
    return _extractor_instance


def extract_entities(text: str, language: Optional[str] = None) -> Dict[str, Any]:
    extractor = get_entity_extractor()
    return extractor.extract(text, language=language)


if __name__ == "__main__":
    sample = (
        "My Wildcraft bag containing Lenovo ThinkPad laptop was stolen at Indiranagar Metro Station "
        "yesterday at 6:45 PM. Phone: +91 9876543210. Approximate loss is 55000 rupees."
    )
    res = extract_entities(sample)
    print("Sample:", sample)
    print("Entities:", res["extracted_entities"])
    print("Method:", res["extraction_method"])
    print("Available:", res["available_fields"])
    print("Missing:", res["missing_fields"])
