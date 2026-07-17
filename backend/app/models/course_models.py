from __future__ import annotations
import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(512), nullable=False)
    stored_filename = Column(String(512), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(64), nullable=False, default="pending")

    courses = relationship("Course", back_populates="document")


class Course(Base):
    __tablename__ = "courses"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(PG_UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    title = Column(String(1024), nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(String(64), nullable=True)
    estimated_time = Column(String(64), nullable=True)

    document = relationship("Document", back_populates="courses")
    chapters = relationship("Chapter", back_populates="course", cascade="all, delete-orphan")


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(PG_UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    title = Column(String(1024), nullable=False)
    position = Column(Integer, nullable=False, default=0)

    course = relationship("Course", back_populates="chapters")
    lessons = relationship("Lesson", back_populates="chapter", cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=False)
    title = Column(String(1024), nullable=False)
    content = Column(Text, nullable=True)
    examples = Column(JSONB, nullable=True)
    key_takeaways = Column(JSONB, nullable=True)
    summary = Column(Text, nullable=True)
    is_completed = Column(Integer, nullable=False, default=0)
    position = Column(Integer, nullable=False, default=0)

    chapter = relationship("Chapter", back_populates="lessons")
