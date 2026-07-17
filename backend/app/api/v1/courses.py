from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from uuid import UUID

from app.db.session import get_db
from app.models.course_models import Course as CourseModel, Chapter as ChapterModel, Lesson as LessonModel
from app.schemas.course import CourseOut, ChapterOut, LessonOut

router = APIRouter()


@router.get("/courses/{course_id}", response_model=CourseOut)
async def get_course(course_id: str, db: AsyncSession = Depends(get_db)):
    try:
        course_uuid = UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid course ID format")
    
    # Explicitly load chapters and their lessons using joinedload
    stmt = (
        select(CourseModel)
        .where(CourseModel.id == course_uuid)
        .options(joinedload(CourseModel.chapters).joinedload(ChapterModel.lessons))
    )
    res = await db.execute(stmt)
    course = res.unique().scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # load chapters and lessons
    chapters = []
    sorted_chapters = sorted(course.chapters, key=lambda c: c.position or 0)
    for ch in sorted_chapters:
        lessons = []
        sorted_lessons = sorted(ch.lessons, key=lambda l: l.position or 0)
        for l in sorted_lessons:
            lessons.append(LessonOut(
                id=l.id,
                title=l.title,
                content=l.content,
                examples=l.examples,
                key_takeaways=l.key_takeaways,
                summary=l.summary,
                position=l.position,
            ))
        chapters.append(ChapterOut(id=ch.id, title=ch.title, position=ch.position, lessons=lessons))

    return CourseOut(id=course.id, title=course.title, description=course.description, difficulty=course.difficulty, estimated_time=course.estimated_time, chapters=chapters)
