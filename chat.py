"""
backend/app/api/v1/chat.py
---------------------------
RAG-style chat endpoint for the Structura AI Study Tutor.

Assumptions about the surrounding project (adjust imports to match your repo):
  - app.db.session.get_db            -> yields a SQLAlchemy Session
  - app.models.course.CourseModel     -> Course(id, user_id, title, ...)
  - app.models.lesson.LessonModel     -> Lesson(id, course_id, title, content, order_index)
  - ANTHROPIC_API_KEY is set in the environment
  - CLAUDE_MODEL env var optionally overrides the default model string

Strict multi-tenant isolation: every DB query in this module filters on
`CourseModel.user_id == x_user_id`. No cross-user data ever enters a prompt.
"""

from __future__ import annotations

import os
import logging
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from anthropic import Anthropic, APIError

from app.db.session import get_db
from app.models.course import CourseModel
from app.models.lesson import LessonModel

logger = logging.getLogger("structura.chat")

router = APIRouter(prefix="/api/v1", tags=["chat"])

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-5-20250929")
MAX_HISTORY_TURNS = 10
MAX_COURSE_CONTEXT_CHARS = 180_000  # guardrail against runaway prompt sizes

_client: Optional[Anthropic] = None


def get_anthropic_client() -> Anthropic:
    global _client
    if _client is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY is not configured")
        _client = Anthropic(api_key=api_key)
    return _client


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

GroundingMode = Literal["courses_only", "both", "web_only"]


class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    course_id: Optional[str] = None
    grounding_mode: GroundingMode = "both"
    history: List[ChatHistoryMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    response: str
    sources: List[str] = Field(default_factory=list)
    grounding_mode: GroundingMode


class CourseSummary(BaseModel):
    id: str
    title: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _require_user_id(x_user_id: Optional[str]) -> str:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing x-user-id header")
    return x_user_id


def _get_owned_course_or_404(db: Session, course_id: str, user_id: str) -> CourseModel:
    """Fetch a course, strictly scoped to the requesting user.

    We look it up by (id, user_id) directly rather than fetching by id and
    then checking ownership, so a 404 is indistinguishable whether the course
    doesn't exist or belongs to someone else. This avoids leaking the
    existence of other users' course IDs.
    """
    course = (
        db.query(CourseModel)
        .filter(CourseModel.id == course_id, CourseModel.user_id == user_id)
        .first()
    )
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


def _list_owned_courses(db: Session, user_id: str) -> List[CourseModel]:
    return db.query(CourseModel).filter(CourseModel.user_id == user_id).all()


def _build_full_course_context(db: Session, course: CourseModel) -> str:
    """Return the full, untruncated text of every lesson in `course`.

    Used when the user has explicitly selected a single course, so that
    precise document questions (exact figures, formulas, policy wording)
    can be answered with full fidelity rather than a lossy summary.
    """
    lessons = (
        db.query(LessonModel)
        .filter(LessonModel.course_id == course.id)
        .order_by(LessonModel.order_index.asc())
        .all()
    )

    parts = [f"# Course: {course.title}\n"]
    for lesson in lessons:
        parts.append(f"\n## Lesson: {lesson.title}\n{lesson.content}\n")

    context = "".join(parts)
    if len(context) > MAX_COURSE_CONTEXT_CHARS:
        logger.warning(
            "Course context for course_id=%s exceeds %s chars; truncating tail.",
            course.id,
            MAX_COURSE_CONTEXT_CHARS,
        )
        context = context[:MAX_COURSE_CONTEXT_CHARS] + "\n\n[...context truncated due to length...]"
    return context


def _build_all_courses_light_context(db: Session, user_id: str) -> str:
    """Lightweight cross-course context (titles + lesson titles only).

    Used for general questions like "what should I study next" when no
    single course is selected, keeping the prompt small while still giving
    the model visibility into the user's full curriculum.
    """
    courses = _list_owned_courses(db, user_id)
    if not courses:
        return ""

    lines = ["Here is the user's current course library (titles only):\n"]
    for course in courses:
        lesson_titles = (
            db.query(LessonModel.title)
            .filter(LessonModel.course_id == course.id)
            .order_by(LessonModel.order_index.asc())
            .all()
        )
        titles = ", ".join(t[0] for t in lesson_titles) or "(no lessons yet)"
        lines.append(f"- {course.title}: {titles}")
    return "\n".join(lines)


def _system_prompt(grounding_mode: GroundingMode, course_context: str) -> str:
    if grounding_mode == "web_only":
        return (
            "You are Structura's AI study tutor. Answer using your general world "
            "knowledge. Do not reference or cite any uploaded course material, "
            "and do not fabricate course-specific facts. Keep answers concise, "
            "friendly, and formatted in Markdown."
        )

    if grounding_mode == "courses_only":
        if not course_context.strip():
            return (
                "You are Structura's AI study tutor operating in 'Courses Only' "
                "mode. The user currently has no course material available to "
                "you. You MUST refuse to answer using outside knowledge. "
                "Politely explain that you don't have any uploaded course "
                "content to answer from yet, and suggest they upload a lesson "
                "or switch to a different knowledge mode."
            )
        return (
            "You are Structura's AI study tutor operating in strict 'Courses "
            "Only' mode. You MUST answer using ONLY the course material "
            "provided below. If the user's question cannot be answered from "
            "this material, politely say that the answer isn't covered in "
            "their uploaded course content and refuse to use outside "
            "knowledge, even if you know the general answer. Quote or "
            "reference specific lessons when relevant. Format responses in "
            "Markdown.\n\n"
            "=== COURSE MATERIAL (verbatim, ground truth) ===\n"
            f"{course_context}\n"
            "=== END COURSE MATERIAL ==="
        )

    # grounding_mode == "both"
    base = (
        "You are Structura's AI study tutor operating in 'Courses + Web' mode. "
        "Prioritize the user's own course material for anything it covers, and "
        "supplement with your general knowledge for context, related concepts, "
        "or anything the course material doesn't address. Clearly distinguish "
        "when you're drawing from the user's course versus general knowledge "
        "(e.g. 'According to your lesson on X...' vs 'More broadly, ...'). "
        "Format responses in Markdown."
    )
    if course_context.strip():
        base += (
            "\n\n=== USER'S COURSE MATERIAL ===\n"
            f"{course_context}\n"
            "=== END COURSE MATERIAL ==="
        )
    return base


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.get("/courses", response_model=List[CourseSummary])
def list_courses(
    x_user_id: Optional[str] = Header(None, alias="x-user-id"),
    db: Session = Depends(get_db),
) -> List[CourseSummary]:
    """List courses owned by the requesting user only (for the chat widget's
    course-scope dropdown)."""
    user_id = _require_user_id(x_user_id)
    courses = _list_owned_courses(db, user_id)
    return [CourseSummary(id=c.id, title=c.title) for c in courses]


@router.post("/chat", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    x_user_id: Optional[str] = Header(None, alias="x-user-id"),
    db: Session = Depends(get_db),
) -> ChatResponse:
    user_id = _require_user_id(x_user_id)

    # ---- Build course context strictly scoped to this user -----------------
    course_context = ""
    sources: List[str] = []

    if payload.grounding_mode != "web_only":
        if payload.course_id:
            # Full-context mode: ownership is verified here, so a request for
            # someone else's course_id fails closed with a 404, never a leak.
            course = _get_owned_course_or_404(db, payload.course_id, user_id)
            course_context = _build_full_course_context(db, course)
            sources = [course.title]
        else:
            course_context = _build_all_courses_light_context(db, user_id)
            sources = []

    system_prompt = _system_prompt(payload.grounding_mode, course_context)

    # ---- Assemble bounded conversation history ------------------------------
    trimmed_history = payload.history[-MAX_HISTORY_TURNS:]
    anthropic_messages = [{"role": m.role, "content": m.content} for m in trimmed_history]
    anthropic_messages.append({"role": "user", "content": payload.message})

    # ---- Call the model -------------------------------------------------------
    try:
        client = get_anthropic_client()
        completion = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1500,
            system=system_prompt,
            messages=anthropic_messages,
        )
    except RuntimeError as exc:
        logger.exception("Anthropic client misconfigured")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except APIError as exc:
        logger.exception("Anthropic API error")
        raise HTTPException(status_code=502, detail="The AI tutor is temporarily unavailable.") from exc

    response_text = "".join(
        block.text for block in completion.content if getattr(block, "type", None) == "text"
    ).strip()

    if not response_text:
        response_text = "I wasn't able to generate a response. Please try rephrasing your question."

    return ChatResponse(
        response=response_text,
        sources=sources if payload.grounding_mode != "web_only" else [],
        grounding_mode=payload.grounding_mode,
    )
