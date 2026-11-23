import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent.parent / "complaints.db"


def get_connection():
    """Create a new SQLite connection with dictionary row access."""
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def get_db():
    """Context manager yielding SQLite connection with auto-commit/rollback."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Initialize database tables for complaints, timelines, and officer notes."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS complaints (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reference_number TEXT UNIQUE NOT NULL,
                complainant_name TEXT NOT NULL,
                complainant_phone TEXT NOT NULL,
                complainant_email TEXT DEFAULT '',
                complainant_address TEXT DEFAULT '',
                incident_category TEXT NOT NULL,
                predicted_category TEXT DEFAULT '',
                model_confidence REAL DEFAULT 0.0,
                incident_date TEXT NOT NULL,
                incident_time TEXT NOT NULL,
                incident_location TEXT NOT NULL,
                incident_landmark TEXT DEFAULT '',
                description TEXT NOT NULL,
                original_transcript TEXT DEFAULT '',
                corrected_transcript TEXT DEFAULT '',
                is_transcript_edited INTEGER DEFAULT 0,
                status TEXT DEFAULT 'Pending Review',
                priority TEXT DEFAULT 'Medium',
                assigned_officer TEXT DEFAULT '',
                police_station TEXT DEFAULT 'Central Police Station',
                extracted_entities_json TEXT DEFAULT '{}',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS complaint_timeline (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                complaint_id INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                status TEXT NOT NULL,
                actor TEXT NOT NULL,
                role TEXT NOT NULL,
                note TEXT NOT NULL,
                FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
            );
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS officer_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                complaint_id INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                officer_name TEXT NOT NULL,
                badge_number TEXT DEFAULT '',
                note TEXT NOT NULL,
                FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
            );
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_comp_ref ON complaints(reference_number);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_timeline_comp ON complaint_timeline(complaint_id);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_notes_comp ON officer_notes(complaint_id);")
