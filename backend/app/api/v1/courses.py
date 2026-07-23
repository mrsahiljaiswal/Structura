from typing import List
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import joinedload
from uuid import UUID

from app.db.session import get_db
from app.models.course_models import Course as CourseModel, Chapter as ChapterModel, Lesson as LessonModel
from app.schemas.course import CourseOut, ChapterOut, LessonOut

from fastapi import Form, File, UploadFile
from app.schemas.document import DocumentUploadResponse
from app.services.document import get_document_service

router = APIRouter()


@router.post("/courses/create", response_model=DocumentUploadResponse)
async def create_course(
    files: list[UploadFile] = File(...),
    title: str = Form(default=None),
    x_user_id: str = Header(default="anonymous", alias="X-User-Id"),
) -> DocumentUploadResponse:
    """Create a new synthesized course from one or multiple uploaded documents."""
    if not files:
        raise HTTPException(status_code=400, detail="At least one file must be provided")

    file_tuples = []
    for f in files:
        if not f.filename:
            continue
        content = await f.read()
        file_tuples.append((f.filename, content))

    service = get_document_service()
    response = service.save_batch_upload(
        files=file_tuples,
        course_title=title,
        user_id=x_user_id,
    )
    if response.course_id is None:
        raise HTTPException(status_code=500, detail="Course creation failed")
    return response


@router.get("/courses", response_model=List[CourseOut])
async def list_courses(
    x_user_id: str = Header(default="anonymous", alias="X-User-Id"),
    db: AsyncSession = Depends(get_db)
):
    if not x_user_id or x_user_id == "anonymous":
        return []

    stmt = (
        select(CourseModel)
        .where(CourseModel.user_id == x_user_id)
        .options(joinedload(CourseModel.chapters).joinedload(ChapterModel.lessons))
    )
    res = await db.execute(stmt)
    courses = res.unique().scalars().all()

    out_courses = []
    for course in courses:
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
                    course_id=course.id,
                ))
            chapters.append(ChapterOut(id=ch.id, title=ch.title, position=ch.position, lessons=lessons))
        out_courses.append(CourseOut(
            id=course.id,
            title=course.title,
            description=course.description,
            difficulty=course.difficulty,
            estimated_time=course.estimated_time,
            chapters=chapters,
        ))

    return out_courses


@router.get("/courses/{course_id}", response_model=CourseOut)
async def get_course(
    course_id: str,
    x_user_id: str = Header(default="anonymous", alias="X-User-Id"),
    db: AsyncSession = Depends(get_db)
):
    try:
        course_uuid = UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid course ID format")
    
    stmt = (
        select(CourseModel)
        .where(CourseModel.id == course_uuid)
        .options(joinedload(CourseModel.chapters).joinedload(ChapterModel.lessons))
    )
    res = await db.execute(stmt)
    course = res.unique().scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Only block if course belongs explicitly to User A and requester is explicitly User B
    if (
        course.user_id
        and course.user_id != "anonymous"
        and x_user_id
        and x_user_id != "anonymous"
        and course.user_id != x_user_id
    ):
        raise HTTPException(status_code=403, detail="Access denied: Course belongs to another user")

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


@router.delete("/courses/{course_id}")
async def delete_course(
    course_id: str,
    x_user_id: str = Header(default="anonymous", alias="X-User-Id"),
    db: AsyncSession = Depends(get_db)
):
    """Delete a course and all associated chapters/lessons by ID."""
    try:
        course_uuid = UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid course ID format")

    stmt = select(CourseModel).where(CourseModel.id == course_uuid)
    res = await db.execute(stmt)
    course = res.scalars().first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if (
        course.user_id
        and course.user_id != "anonymous"
        and x_user_id
        and x_user_id != "anonymous"
        and course.user_id != x_user_id
    ):
        raise HTTPException(status_code=403, detail="Access denied: Cannot delete another user's course")

    await db.delete(course)
    await db.commit()

    return {"status": "success", "message": f"Course {course_id} deleted successfully."}


@router.get("/chapters/{chapter_id}/quiz")
async def get_chapter_quiz(chapter_id: str, db: AsyncSession = Depends(get_db)):
    """Automatically generate a multi-format quiz (Multiple Choice, True/False, Short Answer) for a chapter."""
    try:
        ch_uuid = UUID(chapter_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid chapter ID format")

    stmt = select(ChapterModel).where(ChapterModel.id == ch_uuid).options(joinedload(ChapterModel.lessons))
    res = await db.execute(stmt)
    chapter = res.unique().scalars().first()

    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    combined_text = "\n\n".join([f"Lesson: {l.title}\n{l.content}" for l in chapter.lessons if l.content])
    if not combined_text.strip():
        return {"questions": []}

    from app.common.llm_client import LLMClient
    import anyio
    llm = LLMClient()

    system_prompt = (
        "You are an expert educational assessment creator. Generate a 5-question comprehensive chapter quiz based strictly on the provided chapter lessons.\n"
        "The quiz MUST include a diverse mix of question types:\n"
        "1. Multiple Choice (type: 'multiple_choice') with 4 options, 'answerIndex' (0-3), and 'correctAnswer'\n"
        "2. True/False (type: 'true_false') with options ['True', 'False'], 'answerIndex' (0 or 1), and 'correctAnswer'\n"
        "3. Short Answer (type: 'short_answer') with 'correctAnswer' (concise string answer) and empty options list []\n"
        "Your response MUST be a JSON object with a single 'questions' list matching this structure:\n"
        "{\n"
        "  \"questions\": [\n"
        "    {\n"
        "      \"id\": 1,\n"
        "      \"type\": \"multiple_choice\",\n"
        "      \"question\": \"...\",\n"
        "      \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],\n"
        "      \"answerIndex\": 1,\n"
        "      \"correctAnswer\": \"Option B\",\n"
        "      \"explanation\": \"Detailed explanation of why this answer is correct.\"\n"
        "    }\n"
        "  ]\n"
        "}\n"
        "Ensure all questions are strictly derived from the chapter text."
    )

    user_prompt = f"Chapter Title: {chapter.title}\n\nChapter Content:\n{combined_text}"

    try:
        quiz_data = await anyio.to_thread.run_sync(llm.complete_json, system_prompt, user_prompt)
        if not isinstance(quiz_data, dict) or "questions" not in quiz_data:
            raise HTTPException(status_code=500, detail="Invalid quiz format generated by AI")

        for i, q in enumerate(quiz_data["questions"]):
            q["id"] = i + 1
            if "type" not in q:
                q["type"] = "multiple_choice"
            if "options" not in q:
                q["options"] = []
            if "answerIndex" not in q:
                q["answerIndex"] = 0
            if "correctAnswer" not in q:
                if q.get("options") and len(q["options"]) > q.get("answerIndex", 0):
                    q["correctAnswer"] = q["options"][q["answerIndex"]]
                else:
                    q["correctAnswer"] = ""

        return {"questions": quiz_data["questions"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate chapter quiz: {str(e)}")
