"""
Model Experimentation & Selection Pipeline (Leak-Free, CV on train+val only).
Evaluates multiple architectures with Stratified 5-Fold Cross Validation.
Optimizes for Macro F1 and Accuracy on the training/validation split.
"""
from pathlib import Path
import numpy as np
import pandas as pd
from scipy.sparse import hstack, csr_matrix
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import VotingClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression, SGDClassifier
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import StratifiedKFold
from sklearn.naive_bayes import ComplementNB
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.svm import LinearSVC
import re

import sys
sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import PROCESSED_DATA_DIR

# Load train_val dataset only (NEVER touch test.csv during model selection)
train_val_path = PROCESSED_DATA_DIR / "train_val.csv"
df = pd.read_csv(train_val_path)
X = df["text"].values
y = df["category"].values
print(f"Loaded train+val set: {len(X)} samples across {len(np.unique(y))} categories.")

# Domain Keyword Feature Extractor
DOMAIN_KEYWORDS = {
    "theft": [
        "chori", "stolen", "snatch", "snatched", "pickpocket", "theft", "thief", "thieves",
        "burglary", "चोरी", "चुरा", "झपट", "जेबकतरा", "चोर", "लूट", "छीन"
    ],
    "cyber": [
        "upi", "otp", "bank", "account", "debit", "credit", "card", "link", "apk", "kyc",
        "qr", "code", "fraud", "scam", "telegram", "olx", "refund", "anydesk", "hacked",
        "धोखाधड़ी", "फ्रॉड", "खाते", "कट", "पैसे", "ओटीपी", "लिंक"
    ],
    "harassment": [
        "harass", "harassment", "stalk", "stalker", "stalking", "abuse", "abusive", "vulgar",
        "obscene", "threat", "threats", "threatened", "blackmail", "chhedkhani", "dhamki",
        "छेड़खानी", "पीछा", "धमकी", "गाली", "अश्लील", "प्रताड़ित", "दहेज"
    ],
    "missing": [
        "missing", "laapata", "lapata", "lost", "disappeared", "untraceable", "wandered",
        "लापता", "गुमशुदा", "गायब", "नहीं मिला", "लौटा नहीं", "खो गया"
    ],
    "documents": [
        "aadhaar", "pan", "passport", "licence", "license", "marksheet", "degree", "certificate",
        "rc", "voter", "passbook", "cheque", "registry", "ncr",
        "आधार", "पैन", "पासपोर्ट", "लाइसेंस", "मार्कशीट", "डिग्री", "दस्तावेज", "प्रमाण"
    ],
    "assault": [
        "assault", "beat", "beaten", "punched", "kicked", "hit", "knife", "stabbed", "rod",
        "lathi", "stick", "fracture", "bleeding", "wound", "hospital", "stitches", "blood",
        "मारपीट", "मारा", "पीटा", "हमला", "चाकू", "रॉड", "डंडे", "घाव", "खून", "अस्पताल"
    ],
    "other": [
        "noise", "loud", "speaker", "dj", "garbage", "waste", "stray", "dog", "dogs", "cattle",
        "welding", "fumes", "construction", "encroach", "pipeline", "keys", "keys", "lock",
        "शोर", "लाउडस्पीकर", "डीजे", "कूड़ा", "कचरा", "कुत्ते", "नाला", "धुआं", "चाबी"
    ]
}

class DomainKeywordExtractor(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.categories = list(DOMAIN_KEYWORDS.keys())

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        features = np.zeros((len(X), len(self.categories)), dtype=np.float32)
        for i, text in enumerate(X):
            text_lower = str(text).lower()
            for j, cat in enumerate(self.categories):
                count = sum(1 for kw in DOMAIN_KEYWORDS[cat] if kw in text_lower)
                features[i, j] = np.log1p(count)
        return csr_matrix(features)

# Define candidates
experiments = {}

# 1. Old Baseline: Word TF-IDF (1-2) + Logistic Regression (C=2.5)
experiments["1. Baseline Word TF-IDF + LR (C=2.5)"] = Pipeline([
    ("vec", TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, min_df=1, max_df=0.95)),
    ("clf", LogisticRegression(C=2.5, max_iter=1000, random_state=42, class_weight="balanced"))
])

# 2. Baseline Word TF-IDF (1-2) + Calibrated LinearSVC
experiments["2. Baseline Word TF-IDF + Calibrated LinearSVC"] = Pipeline([
    ("vec", TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, min_df=1, max_df=0.95)),
    ("clf", CalibratedClassifierCV(LinearSVC(C=1.0, random_state=42), cv=3))
])

# 3. Word (1-3) + Char_wb (2-5) FeatureUnion + Logistic Regression (C=4.0)
experiments["3. FeatureUnion (Word 1-3 + Char_wb 2-5) + LR (C=4.0)"] = Pipeline([
    ("union", FeatureUnion([
        ("word", TfidfVectorizer(ngram_range=(1, 3), sublinear_tf=True, min_df=2, max_df=0.90, token_pattern=r"(?u)\b\w+\b")),
        ("char", TfidfVectorizer(ngram_range=(2, 5), analyzer="char_wb", sublinear_tf=True, min_df=2, max_df=0.90))
    ])),
    ("clf", LogisticRegression(C=4.0, max_iter=1000, random_state=42, class_weight="balanced"))
])

# 4. FeatureUnion (Word 1-3 + Char_wb 2-5) + Calibrated LinearSVC (C=1.5)
experiments["4. FeatureUnion + Calibrated LinearSVC (C=1.5)"] = Pipeline([
    ("union", FeatureUnion([
        ("word", TfidfVectorizer(ngram_range=(1, 3), sublinear_tf=True, min_df=2, max_df=0.90, token_pattern=r"(?u)\b\w+\b")),
        ("char", TfidfVectorizer(ngram_range=(2, 5), analyzer="char_wb", sublinear_tf=True, min_df=2, max_df=0.90))
    ])),
    ("clf", CalibratedClassifierCV(LinearSVC(C=1.5, random_state=42, dual=False), cv=3))
])

# 5. FeatureUnion (Word + Char_wb + Domain Keywords) + Logistic Regression (C=4.0)
experiments["5. FeatureUnion + Domain Keywords + LR (C=4.0)"] = Pipeline([
    ("union", FeatureUnion([
        ("word", TfidfVectorizer(ngram_range=(1, 3), sublinear_tf=True, min_df=2, max_df=0.90, token_pattern=r"(?u)\b\w+\b")),
        ("char", TfidfVectorizer(ngram_range=(2, 5), analyzer="char_wb", sublinear_tf=True, min_df=2, max_df=0.90)),
        ("domain", DomainKeywordExtractor())
    ])),
    ("clf", LogisticRegression(C=4.0, max_iter=1000, random_state=42, class_weight="balanced"))
])

# 6. FeatureUnion + Domain Keywords + Calibrated LinearSVC (C=1.5)
experiments["6. FeatureUnion + Domain Keywords + Calibrated LinearSVC (C=1.5)"] = Pipeline([
    ("union", FeatureUnion([
        ("word", TfidfVectorizer(ngram_range=(1, 3), sublinear_tf=True, min_df=2, max_df=0.90, token_pattern=r"(?u)\b\w+\b")),
        ("char", TfidfVectorizer(ngram_range=(2, 5), analyzer="char_wb", sublinear_tf=True, min_df=2, max_df=0.90)),
        ("domain", DomainKeywordExtractor())
    ])),
    ("clf", CalibratedClassifierCV(LinearSVC(C=1.5, random_state=42, dual=False), cv=3))
])

# 7. Soft-Voting Ensemble (FeatureUnion with LR + Calibrated LinearSVC + ComplementNB)
class ProbVotingEnsemble(BaseEstimator):
    def __init__(self):
        self.pipe_lr = Pipeline([
            ("union", FeatureUnion([
                ("word", TfidfVectorizer(ngram_range=(1, 3), sublinear_tf=True, min_df=2, max_df=0.90, token_pattern=r"(?u)\b\w+\b")),
                ("char", TfidfVectorizer(ngram_range=(2, 5), analyzer="char_wb", sublinear_tf=True, min_df=2, max_df=0.90)),
                ("domain", DomainKeywordExtractor())
            ])),
            ("clf", LogisticRegression(C=4.0, max_iter=1000, random_state=42, class_weight="balanced"))
        ])
        self.pipe_svm = Pipeline([
            ("union", FeatureUnion([
                ("word", TfidfVectorizer(ngram_range=(1, 3), sublinear_tf=True, min_df=2, max_df=0.90, token_pattern=r"(?u)\b\w+\b")),
                ("char", TfidfVectorizer(ngram_range=(2, 5), analyzer="char_wb", sublinear_tf=True, min_df=2, max_df=0.90)),
                ("domain", DomainKeywordExtractor())
            ])),
            ("clf", CalibratedClassifierCV(LinearSVC(C=1.5, random_state=42, dual=False), cv=3))
        ])

    def fit(self, X, y):
        self.pipe_lr.fit(X, y)
        self.pipe_svm.fit(X, y)
        self.classes_ = self.pipe_lr.classes_
        return self

    def predict_proba(self, X):
        p1 = self.pipe_lr.predict_proba(X)
        p2 = self.pipe_svm.predict_proba(X)
        return (0.5 * p1) + (0.5 * p2)

    def predict(self, X):
        probs = self.predict_proba(X)
        indices = np.argmax(probs, axis=1)
        return self.classes_[indices]

experiments["7. Soft-Voting Ensemble (FeatureUnion LR + Calibrated SVM)"] = ProbVotingEnsemble()

# Run 5-fold Stratified Cross-Validation on train+val
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

print("\n" + "="*80)
print(f"{'MODEL CANDIDATE':<58} | {'CV ACCURACY':<11} | {'CV MACRO F1':<11}")
print("="*80)

results = []
for name, model in experiments.items():
    fold_accs = []
    fold_f1s = []

    for fold, (train_idx, val_idx) in enumerate(cv.split(X, y)):
        X_tr, y_tr = X[train_idx], y[train_idx]
        X_va, y_va = X[val_idx], y[val_idx]

        model.fit(X_tr, y_tr)
        preds = model.predict(X_va)

        acc = accuracy_score(y_va, preds)
        f1 = f1_score(y_va, preds, average="macro")
        fold_accs.append(acc)
        fold_f1s.append(f1)

    mean_acc = np.mean(fold_accs)
    std_acc = np.std(fold_accs)
    mean_f1 = np.mean(fold_f1s)
    std_f1 = np.std(fold_f1s)

    print(f"{name:<58} | {mean_acc*100:5.2f}% ±{std_acc*100:4.2f}% | {mean_f1:6.4f} ±{std_f1:6.4f}")
    results.append({
        "model_name": name,
        "mean_accuracy": mean_acc,
        "std_accuracy": std_acc,
        "mean_macro_f1": mean_f1,
        "std_macro_f1": std_f1
    })

print("="*80)
