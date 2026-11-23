import hashlib
import json
from pathlib import Path
import pandas as pd
from sklearn.model_selection import train_test_split

import sys
sys.path.append(str(Path(__file__).resolve().parent.parent))

from config import RAW_DATA_DIR, PROCESSED_DATA_DIR, EVALUATION_DIR
from nlp.text_preprocessing import clean_text, preprocess_for_tfidf

RAW_CSV_PATH = RAW_DATA_DIR / "complaints_dataset.csv"

def compute_sha256(filepath: Path) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def make_splits():
    df = pd.read_csv(RAW_CSV_PATH)
    print(f"Loaded raw dataset with {len(df)} samples.")

    # Deduplicate strictly on clean text
    df["cleaned_text"] = df["complaint_text"].apply(preprocess_for_tfidf)
    df = df[df["cleaned_text"].str.strip().str.len() > 0]
    df = df.drop_duplicates(subset=["cleaned_text"])
    print(f"After deduplication: {len(df)} samples.")

    # Save cleaned full dataset
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(PROCESSED_DATA_DIR / "cleaned_complaints.csv", index=False, encoding="utf-8")

    # Stratified 80/20 train_val / test split (random_state=42)
    train_val_df, test_df = train_test_split(
        df,
        test_size=0.20,
        random_state=42,
        stratify=df["category"]
    )

    # Within train_val, split into 70% train and 10% validation (1/8 of train_val)
    train_df, val_df = train_test_split(
        train_val_df,
        test_size=0.125,  # 0.125 * 0.80 = 0.10 of total
        random_state=42,
        stratify=train_val_df["category"]
    )

    print(f"\nSplit sizes:")
    print(f"  Train:     {len(train_df)} samples ({len(train_df)/len(df)*100:.1f}%)")
    print(f"  Val:       {len(val_df)} samples ({len(val_df)/len(df)*100:.1f}%)")
    print(f"  Train+Val: {len(train_val_df)} samples ({len(train_val_df)/len(df)*100:.1f}%)")
    print(f"  Test:      {len(test_df)} samples ({len(test_df)/len(df)*100:.1f}%)")

    print("\nTest set class distribution:")
    print(test_df["category"].value_counts())
    assert len(test_df) >= 240, f"Test set must have at least 240 samples, got {len(test_df)}"
    for cat, count in test_df["category"].value_counts().items():
        assert count >= 30, f"Class {cat} must have at least 30 test samples, got {count}"

    # Save files
    test_path = PROCESSED_DATA_DIR / "test.csv"
    train_path = PROCESSED_DATA_DIR / "train.csv"
    val_path = PROCESSED_DATA_DIR / "val.csv"
    train_val_path = PROCESSED_DATA_DIR / "train_val.csv"

    # Save with text and category columns as expected by pipelines
    test_df_save = pd.DataFrame({
        "text": test_df["cleaned_text"],
        "category": test_df["category"],
        "raw_text": test_df["complaint_text"],
        "language": test_df["language"],
        "source": test_df["source"]
    })
    test_df_save.to_csv(test_path, index=False, encoding="utf-8")

    train_df_save = pd.DataFrame({
        "text": train_df["cleaned_text"],
        "category": train_df["category"],
        "raw_text": train_df["complaint_text"],
        "language": train_df["language"],
        "source": train_df["source"]
    })
    train_df_save.to_csv(train_path, index=False, encoding="utf-8")

    val_df_save = pd.DataFrame({
        "text": val_df["cleaned_text"],
        "category": val_df["category"],
        "raw_text": val_df["complaint_text"],
        "language": val_df["language"],
        "source": val_df["source"]
    })
    val_df_save.to_csv(val_path, index=False, encoding="utf-8")

    train_val_df_save = pd.DataFrame({
        "text": train_val_df["cleaned_text"],
        "category": train_val_df["category"],
        "raw_text": train_val_df["complaint_text"],
        "language": train_val_df["language"],
        "source": train_val_df["source"]
    })
    train_val_df_save.to_csv(train_val_path, index=False, encoding="utf-8")

    # Compute & Freeze SHA-256 Hash
    EVALUATION_DIR.mkdir(parents=True, exist_ok=True)
    test_hash = compute_sha256(test_path)
    hash_file = EVALUATION_DIR / "test_set_hash.txt"
    with open(hash_file, "w", encoding="utf-8") as f:
        f.write(test_hash)

    print(f"\nFrozen Test Set saved to: {test_path}")
    print(f"SHA-256 Hash: {test_hash}")
    print(f"Hash saved to: {hash_file}")

if __name__ == "__main__":
    make_splits()
