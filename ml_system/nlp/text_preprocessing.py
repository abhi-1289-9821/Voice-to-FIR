import re
import unicodedata
from typing import List

# Devanagari digits to ASCII digits mapping
DEVANAGARI_DIGITS = str.maketrans("०१२३४५६७८९", "0123456789")

# Hinglish phonetic normalization dictionary
HINGLISH_NORM_MAP = {
    r"\b(chorii|choree|chory|chura|churaa|churaya|churayi)\b": "chori",
    r"\b(gya|gayi|gaye|gaie)\b": "gaya",
    r"\b(paise|rupaye|rupeye|paisa|rupiya)\b": "paise",
    r"\b(laapata|laapataa|lapata|gayab)\b": "lapata",
    r"\b(dhamkiya|dhamkiyan|dhamki|dhamkiyaa)\b": "dhamki",
    r"\b(chhedkhani|chhedna|chheda|chhedta|chhedte)\b": "chhed",
    r"\b(froud|frode|frood)\b": "fraud",
    r"\b(maarpeet|marpeet|peeta|peetkar|maara|marte)\b": "maar",
    r"\b(jhagda|jhagde|jhagda)\b": "jhagda",
    r"\b(ghanti|ghante)\b": "ghanta",
}

# Conservative stopword list: excludes category cues and negations (keeps 'not', 'no', 'without', 'गुम', 'लापता')
SAFE_STOPWORDS = {
    "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with",
    "is", "was", "are", "were", "been", "being", "have", "has", "had", "do", "does", "did",
    "this", "that", "these", "those", "it", "its", "i", "we", "my", "our", "me", "us",
    "का", "के", "की", "को", "में", "से", "पर", "ने", "है", "हैं", "था", "थी", "थे",
    "हो", "हुआ", "हुई", "हुए", "होना", "और", "या", "तो", "भी", "ही", "एक", "यह", "वह",
    "इस", "उस", "अपने", "अपनी", "अपना", "मुझे", "मेरा", "मेरी", "मेरे", "हम", "हमारा"
}


def normalize_unicode(text: str) -> str:
    """Normalize unicode representations (NFKC) and strip zero-width characters."""
    if not text:
        return ""
    text = unicodedata.normalize("NFKC", text)
    # Remove zero-width spaces, joiners, non-joiners
    text = re.sub(r"[\u200B-\u200D\uFEFF]", "", text)
    return text


def normalize_devanagari_digits(text: str) -> str:
    """Convert Devanagari numerals (०-९) to standard ASCII digits (0-9)."""
    if not text:
        return ""
    return text.translate(DEVANAGARI_DIGITS)


def normalize_hinglish_phonetics(text: str) -> str:
    """Normalize common colloquial Hinglish Roman phonetic spellings."""
    if not text:
        return ""
    for pattern, replacement in HINGLISH_NORM_MAP.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text


def clean_text(text: str, preserve_case: bool = False) -> str:
    """
    Standard cleaner for complaint text in English, Hindi, or Hinglish.
    Preserves numbers, currency mentions, and basic sentence markers.
    """
    if not text or not isinstance(text, str):
        return ""

    text = normalize_unicode(text)
    text = normalize_devanagari_digits(text)

    if not preserve_case:
        text = text.lower()

    text = normalize_hinglish_phonetics(text)

    # Normalize currency variants to standard symbol
    text = re.sub(r"\b(rs\.?|inr|rupees?|रुपये|रुपए|रू)\b", "₹", text, flags=re.IGNORECASE)

    # Normalize multiple whitespace, tabs, and newlines
    text = re.sub(r"[\r\n\t]+", " ", text)
    text = re.sub(r"\s{2,}", " ", text)

    return text.strip()


def preprocess_for_tfidf(text: str) -> str:
    """
    Cleaner specifically tailored for TF-IDF feature extraction.
    Retains alphanumeric tokens across English and Devanagari Unicode blocks (\u0900-\u097F).
    Preserves negations, keywords, and structural indicators.
    """
    text = clean_text(text, preserve_case=False)
    # Retain English letters, numbers, and Devanagari characters
    text = re.sub(r"[^\w\s\u0900-\u097F₹]", " ", text)
    words = [w for w in text.split() if len(w) > 1 and w not in SAFE_STOPWORDS]
    return " ".join(words)


def tokenize_words(text: str) -> List[str]:
    """Tokenize text into words supporting English and Devanagari."""
    cleaned = clean_text(text)
    return re.findall(r"[\w\u0900-\u097F]+", cleaned)
