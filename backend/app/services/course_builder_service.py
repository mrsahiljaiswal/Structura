import asyncio
from typing import Dict, Any
from uuid import UUID

from sqlalchemy import create_engine, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.base import Base
from app.db.session import AsyncSessionLocal, engine
from app.models.course_models import Document as DocModel, Course as CourseModel, Chapter as ChapterModel, Lesson as LessonModel


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


def persist_course_sync(document_id: UUID, stored_filename: str, course: Dict[str, Any]):
    """Synchronous wrapper that persists course into the database using the async session."""
    return asyncio.run(_persist_course_async(document_id, stored_filename, course))


def ensure_tables():
    """Create tables synchronously if they don't exist yet. Useful for local/dev runs.
    """
    sync_engine = create_engine(settings.SQLALCHEMY_DATABASE_URI_SYNC)
    Base.metadata.create_all(bind=sync_engine)