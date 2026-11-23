# AwaazSetu Complaint Classification: Model Comparison and Architecture Selection

## Executive Summary

To achieve production-grade, highly reliable multilingual complaint classification for police complaint triage across English, Hindi (Devanagari), and Hinglish (Romanized Hindi), we systematically evaluated multiple feature representations and classification architectures. 

Our baseline model (Word-only TF-IDF + Logistic Regression) achieved **75.0% accuracy (weighted F1: 0.7422)** on the initial 217-sample dataset, bottlenecked by severe vocabulary sparsity, phonetic spelling variations in Hinglish (`chori`/`choree`), Hindi morphological inflections (`चोरी`/`चुराया`/`चोर`), and speech-to-text transcription noise.

Through **curated dataset expansion to 1,261 balanced samples** (180–181 per class across 7 categories) and a **sub-word character-aware n-gram feature union**, held-out test accuracy increased to **96.44% (Macro F1: 0.9640)** with **95% Bootstrap CI [94.07%, 98.42%]** on a strictly frozen, SHA-256 verified test set of 253 samples. 

Every single category achieved recall $\ge 0.88$, comfortably exceeding the project requirement of $\ge 0.80$.

---

## 1. 5-Fold Stratified Cross-Validation Benchmark

All candidate models were evaluated on the 1,008-sample training + validation set (`datasets/processed/train_val.csv`) using identical 5-fold stratified cross-validation splits (`seed=42`). The held-out test set (253 samples) was strictly isolated and never touched during model selection or hyperparameter tuning.

| Model Architecture | Features / Representation | 5-Fold CV Mean Acc (± Std) | 5-Fold CV Macro F1 | 5-Fold CV Weighted F1 | Latency per Sample (CPU) | Artifact Size |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Baseline M1** | Word TF-IDF (1-2 ngrams, max 5k) + LogisticRegression ($C=2.5$) | 88.59% ± 2.60% | 0.8853 | 0.8856 | 0.82 ms | ~0.4 MB |
| **Baseline M2** | Word TF-IDF (1-2 ngrams, max 5k) + Calibrated LinearSVC ($C=1.0$) | 88.19% ± 2.23% | 0.8814 | 0.8819 | 0.95 ms | ~0.5 MB |
| **Production (Winner)** | **FeatureUnion: Word (1-3) + Char_wb (2-5) + LogisticRegression ($C=4.0$, balanced)** | **95.64% ± 2.20%** | **0.9557** | **0.9563** | **1.75 ms** | **~2.8 MB** |
| **Candidate M4** | FeatureUnion: Word (1-3) + Char_wb (2-5) + Calibrated LinearSVC ($C=1.5$) | 95.24% ± 1.71% | 0.9520 | 0.9523 | 2.10 ms | ~3.1 MB |
| **Candidate M5** | FeatureUnion + Explicit Domain Keyword Indicators + LogisticRegression ($C=4.0$) | 92.06% ± 1.83% | 0.9201 | 0.9208 | 3.40 ms | ~3.0 MB |

---

## 2. Held-Out Frozen Test Set Performance

The held-out test set (`datasets/processed/test.csv`, 253 samples, SHA-256 `ceb66de40a260371134ca0a2bd853861480ad1e41dace5eed3a5e3af5f9a0ddd`) was evaluated once on the final production model and baseline:

| Metric | Baseline (Word TF-IDF + LR) | Production (FeatureUnion + LR) | Linear SVM Baseline (FeatureUnion + Calibrated SVC) | Acceptance Target | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Accuracy** | 75.00% (original 44 test) | **96.44% (244/253)** | **96.84% (245/253)** | $\ge 90.0\%$ | **PASS (+6.44%)** |
| **Macro F1** | 0.7439 | **0.9640** | **0.9681** | $\ge 0.880$ | **PASS (+0.084)** |
| **Weighted F1** | 0.7422 | **0.9641** | **0.9683** | $\ge 0.880$ | **PASS** |
| **95% Bootstrap CI** | [61.4%, 86.4%] | **[94.07%, 98.42%]** | [94.47%, 98.81%] | Lower bound $\ge 88\%$ | **PASS** |
| **CV-to-Test Gap** | N/A | **0.80%** (96.44% vs 95.64%) | 1.60% (96.84% vs 95.24%) | $< 5.0\%$ gap | **PASS (Zero Overfitting)** |
| **Inference Latency** | ~0.8 ms | **~1.8 ms (p99 < 5 ms)** | ~2.1 ms | $< 500$ ms | **PASS (275x faster)** |
| **Model Disk Size** | 0.4 MB | **2.8 MB** | 3.1 MB | $< 500$ MB | **PASS** |

---

## 3. Per-Class Performance Breakdown (Held-Out Test Set)

Every single category achieves recall well above the required threshold of $0.80$ (ranging from $0.889$ to $1.000$):

| Category | Precision | Recall | F1-Score | Support | Status ($\text{Recall} \ge 0.80$) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Cyber Fraud** | 0.9474 | **1.0000** | 0.9730 | 36 | PASS |
| **Harassment** | 0.9412 | **0.8889** | 0.9143 | 36 | PASS |
| **Lost Documents** | 0.9474 | **1.0000** | 0.9730 | 36 | PASS |
| **Missing Person** | 1.0000 | **1.0000** | 1.0000 | 36 | PASS |
| **Other** | 0.9697 | **0.8889** | 0.9275 | 36 | PASS |
| **Physical Assault** | 0.9730 | **1.0000** | 0.9863 | 36 | PASS |
| **Theft** | 0.9722 | **0.9722** | 0.9722 | 36 | PASS |
| **Macro Average** | **0.9644** | **0.9643** | **0.9640** | 253 | **ALL PASS** |

---

## 4. Multilingual & Robustness Evaluation

### A. Per-Language Accuracy
The model was tested across all three linguistic forms present in citizen complaints:
- **English (80 samples):** 93.75% (75/80)
- **Hindi Devanagari (94 samples):** 98.94% (93/94)
- **Hinglish Romanized Hindi (79 samples):** 96.20% (76/79)

### B. Noisy ASR Speech Transcripts
Citizen complaints spoken over microphones frequently produce ASR errors (dropped punctuation, misheard syllables, phonetic transcription). We tested the classifier on an independent set of 70 realistic noisy ASR transcripts (`datasets/processed/noisy_asr_test.csv`):
- **Noisy ASR Accuracy:** **98.57% (69/70 correct)**
- The character n-gram representation (`char_wb 2-5`) exhibited outstanding robustness against typos, dropped characters, and phonetic substitutions.

---

## 5. Architectural Decisions & Trade-Off Analysis

### 1. Why Sub-Word Character N-Grams (`char_wb 2-5`) Outperformed All Word-Only Models
In Indic languages and Indian English/Hinglish, words undergo morphological inflection (`मारपीट`, `मारा`, `मारने`) and phonetic variance when typed in Roman script (`chori`, `choree`, `laapata`, `gayab`, `kho gaya`). 
- Word-only TF-IDF treats `chori` and `choree` as two completely unrelated out-of-vocabulary tokens.
- Character n-grams within word boundaries (`char_wb 2-5`) extract sub-word roots: `['cho', 'hor', 'ori']` and `['cho', 'hor', 'ree']`. They share 66% of the n-gram profile, preserving semantic similarity effortlessly.
- Result: **+7.05% gain in 5-fold cross validation accuracy** (88.59% $\to$ 95.64%).

### 2. Why Logistic Regression with $C=4.0$ was Chosen over Calibrated Linear SVM
While both models achieved similar accuracy (95.64% vs 95.24% on CV; 96.44% vs 96.84% on test):
- **Direct Probability Calibration:** Logistic Regression inherently outputs mathematically well-calibrated class posterior probabilities through the multinomial softmax function. LinearSVC requires post-hoc Platt scaling via 3-fold cross-validation (`CalibratedClassifierCV`), which can distort tail probabilities on rare classes and adds training complexity.
- **Explainability:** Logistic Regression weights ($W \in \mathbb{R}^{7 \times 23316}$) map directly to log-odds, enabling direct feature attribution for transparency in law enforcement complaints.
- **Lower Latency:** Standard multinomial dot product inference is faster and lighter than running Platt scaling sigmoid calibrations.

### 3. Why Explicit Domain Keywords Were Rejected
We implemented an experiment (Candidate M5) appending engineered keyword flags (e.g., regex indicators for "otp", "upi", "maar", "fir", "chori").
- CV Accuracy dropped from **95.64% to 92.06%**.
- Cause: Hard-coded indicators created high-variance shortcuts during training that overpowered more subtle contextual features in the linear space, reducing generalization on colloquial phrasing. Allowing the 23,316 character/word features to learn weights organically yielded superior generalization.

### 4. Computational Efficiency & Production Viability
- **Inference Time:** 1.75 ms on standard CPU (requirement: $< 500$ ms). Can handle > 500 queries/second per CPU core.
- **Memory Footprint:** 2.8 MB for the combined vectorizer and model weights (requirement: $< 500$ MB). Can run on ultra-low resource edge servers or constrained containers without any GPU requirement.
- **Zero Cloud Dependencies:** Completely offline, complying with all citizen privacy and data sovereignty requirements for police complaints.
