from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from backend.database.connection import Base


class ComplaintModel(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    reference_number = Column(String(32), unique=True, index=True, nullable=False)
    complainant_name = Column(String(255), nullable=False)
    complainant_phone = Column(String(64), nullable=False)
    complainant_email = Column(String(255), nullable=True, default="")
    complainant_address = Column(Text, nullable=True, default="")

    incident_category = Column(String(128), nullable=False)
    predicted_category = Column(String(128), nullable=True)
    model_confidence = Column(Float, nullable=True, default=0.0)

    incident_date = Column(String(64), nullable=False)
    incident_time = Column(String(64), nullable=False)
    incident_location = Column(String(255), nullable=False)
    incident_landmark = Column(String(255), nullable=True, default="")

    description = Column(Text, nullable=False)
    original_transcript = Column(Text, nullable=True, default="")
    corrected_transcript = Column(Text, nullable=True, default="")
    is_transcript_edited = Column(Boolean, default=False)

    status = Column(String(64), default="Pending Review", nullable=False)
    priority = Column(String(32), default="Medium", nullable=False)
    assigned_officer = Column(String(255), nullable=True, default="")
    police_station = Column(String(255), default="Central Police Station", nullable=False)
    extracted_entities_json = Column(Text, nullable=True, default="{}")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    timeline = relationship(
        "TimelineModel",
        back_populates="complaint",
        cascade="all, delete-orphan",
        order_by="TimelineModel.timestamp.asc()",
    )
    officer_notes = relationship(
        "OfficerNoteModel",
        back_populates="complaint",
        cascade="all, delete-orphan",
        order_by="OfficerNoteModel.timestamp.desc()",
    )


class TimelineModel(Base):
    __tablename__ = "complaint_timeline"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(64), nullable=False)
    actor = Column(String(255), nullable=False)
    role = Column(String(64), nullable=False)
    note = Column(Text, nullable=False)

    complaint = relationship("ComplaintModel", back_populates="timeline")


class OfficerNoteModel(Base):
    __tablename__ = "officer_notes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    officer_name = Column(String(255), nullable=False)
    badge_number = Column(String(64), nullable=True, default="")
    note = Column(Text, nullable=False)

    complaint = relationship("ComplaintModel", back_populates="officer_notes")
