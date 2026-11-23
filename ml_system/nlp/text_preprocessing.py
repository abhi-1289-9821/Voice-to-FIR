import re
import unicodedata
from typing import List

# Common English and Hindi stopwords for complaint text
ENGLISH_STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "as", "at", "be", "because", "been", "before", "being", "below",
    "between", "both", "but", "by", "could", "did", "do", "does", "doing", "down",
    "during", "each", "few", "for", "from", "further", "had", "has", "have",
    "having", "he", "her", "here", "hers", "herself", "him", "himself", "his",
    "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me",
    "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on",
    "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out",
    "over", "own", "same", "she", "should", "so", "some", "such", "than", "that",
    "the", "their", "theirs", "them", "themselves", "then", "there", "these",
    "they", "this", "those", "through", "to", "too", "under", "until", "up",
    "very", "was", "we", "were", "what", "when", "where", "which", "while",
    "who", "whom", "why", "with", "would", "you", "your", "yours", "yourself"
}

HINDI_STOPWORDS = {
    "का", "के", "की", "को", "में", "से", "पर", "ने", "है", "हैं", "था", "थी", "थे",
    "हो", "हुआ", "हुई", "हुए", "होना", "करना", "किया", "गया", "गई", "गए", "और",
    "या", "तो", "भी", "ही", "एक", "यह", "वह", "इस", "उस", "अपने", "अपनी", "अपना",
    "मुझे", "मेरा", "मेरी", "मेरे", "हम", "हमारा", "तुम्हें", "तुम्हारा", "आप", "आपका",
    "कि", "जो", "तक", "लिए", "रहा", "रही", "रहे", "कर", "दिया", "दिए", "दी"
}

ALL_STOPWORDS = ENGLISH_STOPWORDS.union(HINDI_STOPWORDS)


def normalize_unicode(text: str) -> str:
    """Normalize unicode representations (NFKC) and strip zero-width characters."""
    if not text:
        return ""
    text = unicodedata.normalize("NFKC", text)
    # Remove zero-width spaces, joiners, non-joiners
    text = re.sub(r"[\u200B-\u200D\uFEFF]", "", text)
    return text


def clean_text(text: str, preserve_case: bool = False) -> str:
    """
    Standard cleaner for complaint text in English, Hindi, or Hinglish.
    Preserves numbers, currency mentions, and basic sentence markers.
    """
    if not text or not isinstance(text, str):
        return ""

    text = normalize_unicode(text)
    if not preserve_case:
        text = text.lower()

    # Normalize currency variants
    text = re.sub(r"\b(rs\.?|inr|rupees?|रुपये|रुपए|रू)\b", "₹", text, flags=re.IGNORECASE)

    # Normalize multiple whitespace, tabs, and newlines
    text = re.sub(r"[\r\n\t]+", " ", text)
    text = re.sub(r"\s{2,}", " ", text)

    return text.strip()


def preprocess_for_tfidf(text: str) -> str:
    """
    Cleaner specifically tailored for TF-IDF feature extraction.
    Retains alphanumeric tokens across English and Devanagari Unicode blocks.
    """
    text = clean_text(text, preserve_case=False)
    # Retain English letters, numbers, and Devanagari characters (\u0900-\u097F)
    text = re.sub(r"[^\w\s\u0900-\u097F₹]", " ", text)
    words = [w for w in text.split() if len(w) > 1 and w not in ALL_STOPWORDS]
    return " ".join(words)


def tokenize_words(text: str) -> List[str]:
    """Tokenize text into words supporting English and Devanagari."""
    cleaned = clean_text(text)
    return re.findall(r"[\w\u0900-\u097F]+", cleaned)
