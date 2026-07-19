"""User Progress API Endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.db.session import get_db
from app.models.course_models import UserProgress as UserProgressModel
from app.schemas.course import UserProgressSchema

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/progress", response_model=UserProgressSchema)
async def get_user_progress(
    x_user_id: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve or create user progress data based on logged-in user id."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header is missing")

    stmt = select(UserProgressModel).where(UserProgressModel.user_id == x_user_id)
    res = await db.execute(stmt)
    progress = res.scalars().first()

    if not progress:
        # Create a new blank progress record for the user
        progress = UserProgressModel(
            user_id=x_user_id,
            pinned_courses=[],
            favorite_courses=[],
            completed_lessons=[],
            study_time_total=0,
            study_time_by_day={},
            quiz_scores={},
            lesson_notes={},
            streak_count=0,
            streak_last_date=None,
            chat_history=[],
        )
        db.add(progress)
        await db.commit()
        await db.refresh(progress)
    else:
        if progress.pinned_courses is None: progress.pinned_courses = []
        if progress.favorite_courses is None: progress.favorite_courses = []
        if progress.completed_lessons is None: progress.completed_lessons = []
        if progress.study_time_total is None: progress.study_time_total = 0
        if progress.study_time_by_day is None: progress.study_time_by_day = {}
        if progress.quiz_scores is None: progress.quiz_scores = {}
        if progress.lesson_notes is None: progress.lesson_notes = {}
        if progress.streak_count is None or progress.streak_count == 0: progress.streak_count = 1
        if progress.chat_history is None: progress.chat_history = []

    return progress


@router.post("/progress", response_model=UserProgressSchema)
async def update_user_progress(
    progress_data: UserProgressSchema,
    x_user_id: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Save/update user progress data."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header is missing")

    stmt = select(UserProgressModel).where(UserProgressModel.user_id == x_user_id)
    res = await db.execute(stmt)
    progress = res.scalars().first()

    if not progress:
        progress = UserProgressModel(user_id=x_user_id)
        db.add(progress)

    progress.pinned_courses = progress_data.pinned_courses
    progress.favorite_courses = progress_data.favorite_courses
    progress.completed_lessons = progress_data.completed_lessons
    progress.study_time_total = progress_data.study_time_total
    progress.study_time_by_day = progress_data.study_time_by_day
    progress.quiz_scores = progress_data.quiz_scores
    progress.lesson_notes = progress_data.lesson_notes
    progress.streak_count = progress_data.streak_count
    progress.streak_last_date = progress_data.streak_last_date
    progress.chat_history = progress_data.chat_history

    await db.commit()
    await db.refresh(progress)
    return progress
