import json
import random
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from backend.database.connection import get_db
from backend.schemas.complaint import ComplaintCreateRequest, OfficerNoteCreateRequest, StatusUpdateRequest


def _generate_reference_number(conn) -> str:
    """Generate a unique reference number in format AS-2026-XXXX."""
    for _ in range(50):
        suffix = random.randint(100, 9999)
        ref = f"AS-2026-{suffix:04d}"
        cur = conn.execute("SELECT 1 FROM complaints WHERE reference_number = ?", (ref,))
        if not cur.fetchone():
            return ref
    return f"AS-2026-{int(datetime.utcnow().timestamp()) % 10000:04d}"


def _fetch_complaint_full(conn, comp_id: int) -> Optional[Dict[str, Any]]:
    cur = conn.execute("SELECT * FROM complaints WHERE id = ?", (comp_id,))
    row = cur.fetchone()
    if not row:
        return None

    # Fetch timeline
    t_cur = conn.execute(
        "SELECT * FROM complaint_timeline WHERE complaint_id = ? ORDER BY timestamp ASC",
        (comp_id,),
    )
    timeline_items = [
        {
            "id": f"t-{t['id']}",
            "timestamp": t["timestamp"],
            "status": t["status"],
            "actor": t["actor"],
            "role": t["role"],
            "note": t["note"],
        }
        for t in t_cur.fetchall()
    ]

    # Fetch notes
    n_cur = conn.execute(
        "SELECT * FROM officer_notes WHERE complaint_id = ? ORDER BY timestamp DESC",
        (comp_id,),
    )
    notes_items = [
        {
            "id": f"n-{n['id']}",
            "timestamp": n["timestamp"],
            "officerName": n["officer_name"],
            "badgeNumber": n["badge_number"] or "",
            "note": n["note"],
        }
        for n in n_cur.fetchall()
    ]

    entities = {}
    if row["extracted_entities_json"]:
        try:
            entities = json.loads(row["extracted_entities_json"])
        except Exception:
            entities = {}

    return {
        "id": f"c-{row['id']}",
        "referenceNumber": row["reference_number"],
        "complainantName": row["complainant_name"],
        "complainantPhone": row["complainant_phone"],
        "complainantEmail": row["complainant_email"] or "",
        "complainantAddress": row["complainant_address"] or "",
        "incidentCategory": row["incident_category"],
        "incidentDate": row["incident_date"],
        "incidentTime": row["incident_time"],
        "incidentLocation": row["incident_location"],
        "incidentLandmark": row["incident_landmark"] or "",
        "description": row["description"],
        "rawTranscript": row["corrected_transcript"] or row["original_transcript"] or row["description"],
        "isTranscriptEdited": bool(row["is_transcript_edited"]),
        "status": row["status"],
        "priority": row["priority"],
        "assignedOfficer": row["assigned_officer"] or "",
        "policeStation": row["police_station"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
        "timeline": timeline_items,
        "officerNotes": notes_items,
        "mockAudioLengthSeconds": 42,
        "predictedCategory": row["predicted_category"],
        "modelConfidence": row["model_confidence"],
        "extractedEntities": entities,
    }


def create_complaint(req: ComplaintCreateRequest) -> Dict[str, Any]:
    with get_db() as conn:
        ref_num = _generate_reference_number(conn)
        now_iso = datetime.now(timezone.utc).isoformat()
        entities_json = json.dumps(req.extracted_entities) if req.extracted_entities else "{}"

        cur = conn.execute(
            """
            INSERT INTO complaints (
                reference_number, complainant_name, complainant_phone, complainant_email,
                complainant_address, incident_category, predicted_category, model_confidence,
                incident_date, incident_time, incident_location, incident_landmark,
                description, original_transcript, corrected_transcript, is_transcript_edited,
                status, priority, assigned_officer, police_station, extracted_entities_json,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                ref_num,
                req.complainant_name,
                req.complainant_phone,
                req.complainant_email or "",
                req.complainant_address or "",
                req.incident_category,
                req.predicted_category or "",
                req.model_confidence or 0.0,
                req.incident_date,
                req.incident_time,
                req.incident_location,
                req.incident_landmark or "",
                req.description,
                req.original_transcript or "",
                req.corrected_transcript or "",
                1 if req.is_transcript_edited else 0,
                "Pending Review",
                req.priority or "Medium",
                "",
                req.police_station or "Central Police Station",
                entities_json,
                now_iso,
                now_iso,
            ),
        )
        comp_id = cur.lastrowid

        # Insert initial timeline record
        conn.execute(
            """
            INSERT INTO complaint_timeline (complaint_id, timestamp, status, actor, role, note)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                comp_id,
                now_iso,
                "Pending Review",
                req.complainant_name,
                "Complainant",
                f"Complaint lodged via AwaazSetu portal. Assigned reference {ref_num}.",
            ),
        )

        return _fetch_complaint_full(conn, comp_id)


def list_complaints(
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    with get_db() as conn:
        query = "SELECT id FROM complaints WHERE 1=1"
        params = []

        if status and status != "All":
            query += " AND status = ?"
            params.append(status)
        if category and category != "All":
            query += " AND incident_category = ?"
            params.append(category)
        if search:
            query += " AND (reference_number LIKE ? OR complainant_name LIKE ? OR incident_location LIKE ? OR description LIKE ?)"
            s = f"%{search}%"
            params.extend([s, s, s, s])

        query += " ORDER BY id DESC"
        cur = conn.execute(query, params)
        ids = [row["id"] for row in cur.fetchall()]
        return [_fetch_complaint_full(conn, cid) for cid in ids]


def get_complaint_by_reference(reference: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        ref_clean = reference.replace("c-", "")
        cur = conn.execute(
            "SELECT id FROM complaints WHERE reference_number = ? OR id = ?",
            (reference, ref_clean),
        )
        row = cur.fetchone()
        if not row:
            return None
        return _fetch_complaint_full(conn, row["id"])


def update_complaint_status(reference: str, req: StatusUpdateRequest) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        ref_clean = reference.replace("c-", "")
        cur = conn.execute(
            "SELECT id, status FROM complaints WHERE reference_number = ? OR id = ?",
            (reference, ref_clean),
        )
        row = cur.fetchone()
        if not row:
            return None

        comp_id = row["id"]
        old_status = row["status"]
        now_iso = datetime.now(timezone.utc).isoformat()

        conn.execute(
            "UPDATE complaints SET status = ?, updated_at = ? WHERE id = ?",
            (req.status, now_iso, comp_id),
        )

        note_text = req.note or f"Status updated from '{old_status}' to '{req.status}'."
        conn.execute(
            """
            INSERT INTO complaint_timeline (complaint_id, timestamp, status, actor, role, note)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                comp_id,
                now_iso,
                req.status,
                req.actor or "Assigned Officer",
                req.role or "Police Officer",
                note_text,
            ),
        )

        return _fetch_complaint_full(conn, comp_id)


def add_officer_note(reference: str, req: OfficerNoteCreateRequest) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        ref_clean = reference.replace("c-", "")
        cur = conn.execute(
            "SELECT id FROM complaints WHERE reference_number = ? OR id = ?",
            (reference, ref_clean),
        )
        row = cur.fetchone()
        if not row:
            return None

        comp_id = row["id"]
        now_iso = datetime.now(timezone.utc).isoformat()

        conn.execute(
            """
            INSERT INTO officer_notes (complaint_id, timestamp, officer_name, badge_number, note)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                comp_id,
                now_iso,
                req.officer_name,
                req.badge_number or "",
                req.note,
            ),
        )
        conn.execute("UPDATE complaints SET updated_at = ? WHERE id = ?", (now_iso, comp_id))

        return _fetch_complaint_full(conn, comp_id)


def get_timeline(reference: str) -> Optional[List[Dict[str, Any]]]:
    comp = get_complaint_by_reference(reference)
    if not comp:
        return None
    return comp.get("timeline", [])
