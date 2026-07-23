import asyncio
import logging
from typing import Dict, Any
from uuid import UUID

from sqlalchemy import create_engine, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.base import Base
from app.db.session import AsyncSessionLocal, engine
from app.models.course_models import Document as DocModel, Course as CourseModel, Chapter as ChapterModel, Lesson as LessonModel

logger = logging.getLogger(__name__)


async def _persist_course_async(document_id: UUID, stored_filename: str, course: Dict[str, Any]) -> UUID:
    async with AsyncSessionLocal() as session:  # type: AsyncSession
        # Ensure document row exists (or create minimal)
        stmt = select(DocModel).where(DocModel.id == document_id)
        res = await session.execute(stmt)
        doc = res.scalars().first()
        if doc is None:
            doc = DocModel(id=document_id, filename=stored_filename, stored_filename=stored_filename, size_bytes=0, status="processed")
            session.add(doc)
            await session.flush()

        course_row = CourseModel(document_id=document_id, title=course.get("title", "Generated Course"), description=course.get("description"), difficulty=course.get("difficulty"))
        session.add(course_row)
        await session.flush()

        for ci, ch in enumerate(course.get("chapters", []), start=1):
            chapter_row = ChapterModel(course_id=course_row.id, title=ch.get("title", f"Chapter {ci}"), position=ci)
            session.add(chapter_row)
            await session.flush()
            for li, lesson in enumerate(ch.get("lessons", []), start=1):
                lesson_row = LessonModel(
                    chapter_id=chapter_row.id,
                    title=lesson.get("title", f"Lesson {li}"),
                    content=lesson.get("content"),
                    examples=lesson.get("examples"),
                    key_takeaways=lesson.get("key_takeaways"),
                    summary=lesson.get("summary"),
                    position=li,
                )
                session.add(lesson_row)
        await session.commit()
        return course_row.id


from app.services.course_assembly.schema import FinalCourse

def _format_lesson_content(lesson) -> str:
    """Helper to format modular lesson fields into markdown for content field."""
    parts = []
    
    # 1. Overview
    if getattr(lesson, "overview", None):
        parts.append(f"## Overview\n{lesson.overview}")
        
    # 2. Theory (Main body)
    if getattr(lesson, "theory", None):
        parts.append(f"## Theory\n{lesson.theory}")
        
    # 3. Definitions
    defs = getattr(lesson, "definitions", None)
    if defs:
        parts.append("## Key Definitions")
        for definition in defs:
            parts.append(f"- {definition}")
            
    # 4. Analogies
    anals = getattr(lesson, "analogies", None)
    if anals:
        parts.append("## Analogies & Explanations")
        for analogy in anals:
            parts.append(f"- {analogy}")
            
    # 5. Misconceptions
    miscon = getattr(lesson, "misconceptions", None)
    if miscon:
        parts.append("## Common Misconceptions")
        for misconception in miscon:
            parts.append(f"- {misconception}")
            
    # 6. Real-world Applications
    apps = getattr(lesson, "applications", None)
    if apps:
        parts.append("## Real-World Applications")
        for app in apps:
            parts.append(f"- {app}")
            
    return "\n\n".join(parts)


def persist_course_sync(document_id: UUID, stored_filename: str, course: Any, user_id: str = None, source_documents: list[dict] = None):
    """Persist course into database using a synchronous SQLAlchemy session.

    Supports both legacy dict format and FinalCourse Pydantic object.
    Also persists individual source document records for multi-document courses.
    """
    logger.info(f"Starting course persistence for document {document_id}")
    try:
        sync_engine = create_engine(settings.SQLALCHEMY_DATABASE_URI_SYNC)
        SyncSession = sessionmaker(bind=sync_engine)

        with SyncSession() as session:
            stmt = select(DocModel).where(DocModel.id == document_id)
            res = session.execute(stmt)
            doc = res.scalars().first()
            if doc is None:
                logger.info(f"Creating Document row for ID: {document_id}")
                doc = DocModel(
                    id=document_id,
                    filename=stored_filename,
                    stored_filename=stored_filename,
                    size_bytes=0,
                    status="processed",
                )
                session.add(doc)
                session.flush()

            if isinstance(course, dict):
                title = course.get("title") or course.get("course_title", "Generated Course")
                description = course.get("description", "")
                difficulty = course.get("difficulty", "Intermediate")
            else:
                title = getattr(course, "course_title", None) or getattr(course, "title", "Generated Course")
                description = getattr(course, "description", "")
                difficulty = getattr(course, "difficulty", "Intermediate")

            logger.info(f"Creating Course row: '{title}' (user_id={user_id})")
            course_row = CourseModel(
                document_id=document_id,
                user_id=user_id,
                title=title,
                description=description,
                difficulty=difficulty,
            )
            session.add(course_row)
            session.flush()

            if source_documents:
                for s_doc in source_documents:
                    s_row = SourceDocumentModel(
                        course_id=course_row.id,
                        filename=s_doc.get("filename", "document"),
                        stored_filename=s_doc.get("stored_filename", "document"),
                        file_type=s_doc.get("file_type", "pdf"),
                        size_bytes=s_doc.get("size_bytes", 0),
                        page_count=s_doc.get("page_count", 0),
                    )
                    session.add(s_row)
                session.flush()

            logger.info(f"Course created with ID: {course_row.id}")

            if isinstance(course, dict):
                # Legacy dictionary persistence
                chapters_count = len(course.get("chapters", []))
                logger.info(f"Creating {chapters_count} chapters from legacy dict...")
                for ci, ch in enumerate(course.get("chapters", []), start=1):
                    logger.info(f"  Creating chapter {ci}/{chapters_count}: {ch.get('title')}")
                    chapter_row = ChapterModel(course_id=course_row.id, title=ch.get("title", f"Chapter {ci}"), position=ci)
                    session.add(chapter_row)
                    session.flush()
                    
                    lessons_count = len(ch.get("lessons", []))
                    for li, lesson in enumerate(ch.get("lessons", []), start=1):
                        logger.info(f"    Creating lesson {li}/{lessons_count}: {lesson.get('title')}")
                        lesson_row = LessonModel(
                            chapter_id=chapter_row.id,
                            title=lesson.get("title", f"Lesson {li}"),
                            content=lesson.get("content"),
                            examples=lesson.get("examples"),
                            key_takeaways=lesson.get("key_takeaways"),
                            summary=lesson.get("summary"),
                            position=li,
                        )
                        session.add(lesson_row)
            else:
                # FinalCourse object persistence (flattening modules -> chapters)
                logger.info("Persisting modules/chapters from FinalCourse object...")
                chapter_pos = 1
                for module in course.modules:
                    for chapter in module.chapters:
                        logger.info(f"  Creating chapter {chapter_pos}: {chapter.title}")
                        chapter_row = ChapterModel(
                            course_id=course_row.id, 
                            title=chapter.title, 
                            position=chapter_pos
                        )
                        session.add(chapter_row)
                        session.flush()

                        for li, assembled_lesson in enumerate(chapter.lessons, start=1):
                            lesson = assembled_lesson.lesson
                            logger.info(f"    Creating lesson {li}: {lesson.title}")
                            
                            formatted_content = _format_lesson_content(lesson)
                            
                            lesson_row = LessonModel(
                                chapter_id=chapter_row.id,
                                title=lesson.title,
                                content=formatted_content,
                                examples=lesson.examples,
                                key_takeaways=lesson.key_takeaways,
                                summary=lesson.summary,
                                position=li,
                            )
                            session.add(lesson_row)
                        
                        chapter_pos += 1
            
            logger.info("Committing course to database...")
            session.commit()
            logger.info(f"Course persistence completed successfully. Course ID: {course_row.id}")
            return course_row.id
    except Exception as e:
        logger.error(f"Error persisting course: {e}", exc_info=True)
        raise



def ensure_tables():
    """Create database tables synchronously if they do not exist yet."""
    logger.info("Ensuring database tables exist...")
    try:
        logger.info(f"Using database: {settings.SQLALCHEMY_DATABASE_URI_SYNC}")
        sync_engine = create_engine(settings.SQLALCHEMY_DATABASE_URI_SYNC)
        Base.metadata.create_all(bind=sync_engine)

        # Migration: Ensure user_id column exists on courses table
        with sync_engine.connect() as conn:
            from sqlalchemy import text
            conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);"))
            conn.commit()

        logger.info("Database tables & columns updated successfully")
    except Exception as e:
        logger.error(f"Failed to create tables: {e}", exc_info=True)
        raise