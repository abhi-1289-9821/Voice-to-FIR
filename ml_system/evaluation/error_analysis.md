# Error Analysis & Baseline Diagnosis — AwaazSetu Complaint Classifier

## 1. Baseline Performance Summary

- **Primary Architecture:** TF-IDF (1–2 n-grams, sublinear TF) + Logistic Regression ($C=2.5$, class_weight='balanced')
- **Baseline Architecture:** TF-IDF + Calibrated Linear SVM ($C=1.0$, 3-fold Platt calibration)
- **Dataset Size:** 217 total raw samples (Train: 173 samples, Held-out Test: 44 samples)
- **Primary Model Held-out Accuracy:** **75.00%** (33/44 correct)
- **Primary Model Macro F1:** **0.7439** | **Weighted F1:** **0.7422**
- **Linear SVM Baseline Accuracy:** **72.73%** | **Weighted F1:** **0.7160**

### Per-Class Baseline Metrics (Logistic Regression)

| Category Class | Precision | Recall | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: |
| **Cyber Fraud** | 0.6667 | 0.6667 | 0.6667 | 6 |
| **Harassment** | 0.5000 | 0.3333 | 0.4000 | 6 |
| **Lost Documents** | 0.8571 | 1.0000 | 0.9231 | 6 |
| **Missing Person** | 0.8333 | 0.8333 | 0.8333 | 6 |
| **Other** | 0.7143 | 0.8333 | 0.7692 | 6 |
| **Physical Assault** | 0.6667 | 0.7500 | 0.7059 | 8 |
| **Theft** | 1.0000 | 0.8333 | 0.9091 | 6 |

### Confusion Matrix (Test Split)

Row = Ground Truth, Column = Predicted:
```
Labels: ['Cyber Fraud', 'Harassment', 'Lost Documents', 'Missing Person', 'Other', 'Physical Assault', 'Theft']

[[4, 0, 1, 0, 0, 1, 0],   # Cyber Fraud
 [2, 2, 0, 1, 1, 0, 0],   # Harassment
 [0, 0, 6, 0, 0, 0, 0],   # Lost Documents
 [0, 1, 0, 5, 0, 0, 0],   # Missing Person
 [0, 0, 0, 0, 5, 1, 0],   # Other
 [0, 1, 0, 0, 1, 6, 0],   # Physical Assault
 [0, 0, 0, 0, 0, 1, 5]]   # Theft
```

---

## 2. Exhaustive Log of Misclassified Test Samples (11 / 44)

| # | True Label | Predicted Label | Confidence | Text Sample | Root Cause & Failure Mode |
|---|---|---|---|---|---|
| 1 | **Physical Assault** | Other | 0.1872 | जमीन झगड़े रिश्तेदार धारदार हथियार हमला करके गंभीर ₹प घायल दिया। | Ambiguity: `जमीन झगड़े` (land dispute) triggered `Other` weights despite explicit violent attack tokens `धारदार हथियार`, `हमला`, `घायल`. |
| 2 | **Missing Person** | Harassment | 0.1757 | 20 वर्षीय बहन कॉलेज लेकिन वापस नहीं आई उसका मोबाइल बंद है। | Vocabulary Sparsity: Short Hindi narrative lacks explicit keyword `गुमशुदा` or `लापता`; model confused disappearance with stalker scenario. |
| 3 | **Harassment** | Missing Person | 0.1828 | ek ladka roz sham ko metro station se peecha karta hai aur chhedta hai | Hinglish Roman Stalking: Tokens `peecha`, `chhedta` were out-of-vocabulary in the tiny 24-sample training set. |
| 4 | **Physical Assault** | Harassment | 0.1786 | सिनेमा हॉल बाहर किसी अज्ञात व्यक्ति चाकू हमला हाथ गहरा घाव दिया। | Semantic Overlap: Stalking/threat features competed with knife assault without sufficient weapon-injury n-gram density. |
| 5 | **Cyber Fraud** | Physical Assault | 0.1681 | कस्टमर केयर गलत नंबर सर्च रिफंड बहाने खाते 22000 साफ दिए। | Hindi Slang / Idiom: `खाते 22000 साफ दिए` (wiped out account) lacked explicit English keywords like UPI/cyber/OTP. |
| 6 | **Harassment** | Other | 0.1666 | neighbor roz gaali galoch karta hai aur darwaze par kooda phekta hai | Boundary Overlap: Neighbor nuisance (`kooda phekta hai`, `gaali galoch`) overlaps with civic nuisance in `Other`. |
| 7 | **Harassment** | Cyber Fraud | 0.2019 | fake instagram account banakar meri photos ke sath harassment kiya ja raha hai | Keyword Misleading: `fake instagram account` strongly activated cyber features rather than personal stalking/harassment. |
| 8 | **Theft** | Physical Assault | 0.2178 | delivery partner took package inside building gate ran away expensive shoes | Narrative Sparsity: Non-standard theft phrasing (`took package... ran away`) was not recognized by narrow vocabulary. |
| 9 | **Other** | Physical Assault | 0.2007 | open burning plastic rubber tires near school ground causing breathing difficulty kids | Class Definition: Civic/environmental hazard in `Other` had minimal samples and no domain-specific semantic anchor. |
| 10 | **Harassment** | Cyber Fraud | 0.2844 | former acquaintance created fake matrimonial profile phone number causing harassment | Digital Harassment Ambiguity: Matrimonial impersonation confused with financial fraud due to digital identifiers. |
| 11 | **Cyber Fraud** | Lost Documents | 0.1767 | इंस्टाग्राम आईडी हैक करके पहचान दोस्तों पैसे मांगे जा हैं। | Token Collision: `आईडी` (ID) and `पहचान` (identity) triggered `Lost Documents` (voter ID, identity card) features. |

---

## 3. Top 3 Confusion Pairs & Diagnostic Analysis

### Pair 1: Harassment vs. Cyber Fraud & Other (Recall: 33.3%, Precision: 50.0%)
- **Diagnostic:** Digital harassment (fake Instagram profiles, morphed photos, matrimonial impersonation, abusive DMs) contains technological vocabulary (`account`, `profile`, `phone number`, `ID`) that pulls toward **Cyber Fraud**. Conversely, neighbor harassment (`gaali galoch`, verbal abuse, door banging) pulls toward **Other** (nuisance/disputes).
- **Remedy:** Distinct training samples differentiating financial cyber theft (UPI, OTP, phishing, bank debit, credit card, investment scams) from digital harassment (blackmail, morphing, stalking, non-consensual sharing).

### Pair 2: Theft vs. Physical Assault (Confusion in both directions)
- **Diagnostic:** Bag snatching, mobile grabbing from moving vehicles, and theft with a shove blur the line between pure theft and assault. Additionally, land/property disputes involving physical attacks get misclassified when property keywords dominate violent action verbs.
- **Remedy:** Explicit coverage of snatching/robbery vs physical battery/weapons. Weight weapon/injury indicators (`चाकू`, `लाठी`, `मारपीट`, `चोट`, `अस्पताल`, `stabbing`, `bleeding`) heavily.

### Pair 3: Hindi & Hinglish Vocabulary Sparsity Across All Classes
- **Diagnostic:** With only ~30 samples per class (~24 training samples), any colloquial Hindi (e.g. `साफ कर दिए`, `झांसे में लेकर`, `लापता`, `वापस नहीं लौटी`) or Roman Hinglish (`peecha karna`, `chhedkhani`, `dhokhadhadi`) had 0 occurrences in training, collapsing predictions into near-uniform ~15% random guesses.
- **Remedy:** Substantially expand the dataset to at least 1,200+ samples (>= 170 per class) with balanced English, Hindi Devanagari, and Hinglish across varied narrative lengths and ASR transcript styles.
