from __future__ import annotations

import logging

from app.common.exceptions import LLMError
from app.common.llm_client import LLMClient
from app.services.lesson_authoring.schema import Lesson
from app.services.semantic_segmentation.schema import LearningUnitSet

from .exceptions import ReviewError
from .schema import ReviewedLesson, ReviewIssue

from app.prompts.modules.review.system import build_review_system_prompt
from app.prompts.modules.review.user import build_review_user_prompt
from app.prompts.registry import get_prompt_version

logger = logging.getLogger(__name__)


class EducationalReviewService:
    """
    Module 9: Educational Review Engine.

    The mandatory gate between lesson authoring and persistence. Nothing
    reaches Module 10 (Course Assembly) without passing through here.
    """

    def __init__(self, llm_client: LLMClient | None = None):
        self.llm = llm_client or LLMClient()
        self._system_prompt = build_review_system_prompt()

    def review(
        self,
        lesson: Lesson,
        units: LearningUnitSet,
    ) -> ReviewedLesson:
        source_units = [
            u
            for u in units.units
            if u.id in lesson.learning_unit_ids
        ]

        if not source_units:
            raise ReviewError(
                f"No source learning units found for lesson '{lesson.title}'."
            )

        source_text = "\n\n".join(
            f"Topic:\n{u.topic}\n\nSummary:\n{u.summary}\n\nContent:\n{u.text}"
            for u in source_units
        )

        lesson_text = (
            f"Overview: {lesson.overview}\n\n"
            f"Theory: {lesson.theory}\n\n"
            f"Definitions: {lesson.definitions}\n"
            f"Examples: {lesson.examples}\n"
            f"Analogies: {lesson.analogies}\n"
            f"Misconceptions: {lesson.misconceptions}\n"
            f"Applications: {lesson.applications}\n\n"
            f"Summary: {lesson.summary}\n"
            f"Key takeaways: {lesson.key_takeaways}"
        )

        prompt = build_review_user_prompt(lesson_text=lesson_text, source_text=source_text)

        logger.info("Reviewing lesson '%s' (prompt_version=%s)", lesson.lesson_id, get_prompt_version("review"))

        try:
            data = self.llm.complete_json(
                self._system_prompt,
                prompt,
            )

        except LLMError as e:
            raise ReviewError(
                f"Failed to review lesson '{lesson.title}': {e}"
            ) from e

        return self._to_reviewed_lesson(
            lesson,
            data,
        )
    @staticmethod
    def _build_prompt(lesson: Lesson, source_text: str) -> str:
        lesson_text = (
            f"Overview: {lesson.overview}\n\n"
            f"Theory: {lesson.theory}\n\n"
            f"Definitions: {lesson.definitions}\n"
            f"Examples: {lesson.examples}\n"
            f"Analogies: {lesson.analogies}\n"
            f"Misconceptions: {lesson.misconceptions}\n"
            f"Applications: {lesson.applications}\n\n"
            f"Summary: {lesson.summary}\n"
            f"Key takeaways: {lesson.key_takeaways}"
        )
        return f"--- LESSON ---\n{lesson_text}\n\n--- SOURCE MATERIAL ---\n{source_text[:8000]}"

    @staticmethod
    def _to_reviewed_lesson(lesson: Lesson, data: dict) -> ReviewedLesson:
        score = data.get("quality_score")
        if score is None or not (0 <= int(score) <= 100):
            raise ReviewError(f"Reviewer returned an invalid quality_score: {score!r}")

        issues = [
            ReviewIssue(category=i.get("category", "consistency"),
                        severity=i.get("severity", "low"),
                        description=i.get("description", ""))
            for i in data.get("issues", [])
        ]
        has_high_severity = any(i.severity == "high" for i in issues)
        # trust the model's `approved` flag but enforce the stated policy as a floor
        approved = (
            bool(data.get("approved", False))
            and int(score) >= 70
            and not has_high_severity
        )

        return ReviewedLesson(lesson=lesson, quality_score=int(score), issues=issues, approved=approved)
