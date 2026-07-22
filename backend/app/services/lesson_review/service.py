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
        return build_review_user_prompt(lesson_text=lesson_text, source_text=source_text)

    @staticmethod
    def _to_reviewed_lesson(lesson: Lesson, data: dict) -> ReviewedLesson:
        from app.prompts.critique.critique_framework import recompute_weighted_score, DIMENSIONS
        from app.prompts.modules.review.system import MIN_APPROVAL_SCORE, MIN_GROUNDING_SCORE

        dims = data.get("dimension_scores", {})
        missing = set(DIMENSIONS) - set(dims)
        if missing:
            raise ReviewError(f"Reviewer response missing dimension scores: {sorted(missing)}")

        reported = data.get("quality_score")
        if reported is not None and not (0 <= int(reported) <= 100):
            raise ReviewError(f"Reviewer returned an invalid quality_score: {reported!r}")

        for name, dscore in dims.items():
            if not (0 <= int(dscore) <= 100):
                raise ReviewError(f"Reviewer returned an invalid score for dimension '{name}': {dscore!r}")

        # server-side recompute — never trust the model's own arithmetic
        recomputed = recompute_weighted_score(dims)
        if reported is None or abs(recomputed - float(reported)) > 5:
            # divergence beyond a small rounding tolerance -> the model's
            # top-line score wasn't actually derived from its own dimensions
            logger.warning(
                "Review quality_score (%s) diverged from recomputed weighted score (%.1f) "
                "for lesson '%s' — using the recomputed value.",
                reported, recomputed, lesson.lesson_id,
            )
        score = round(recomputed)

        issues = [
            ReviewIssue(
                category=i.get("category", "consistency"),
                severity=i.get("severity", "low"),
                dimension=i.get("dimension"),
                description=i.get("description", ""),
                unsupported_claim=i.get("unsupported_claim"),
                suggested_correction=i.get("suggested_correction"),
            )
            for i in data.get("issues", [])
        ]
        has_high_severity = any(i.severity == "high" for i in issues)
        grounding_ok = dims.get("grounding", 0) >= MIN_GROUNDING_SCORE

        approved = (
            bool(data.get("approved", False))
            and score >= MIN_APPROVAL_SCORE
            and grounding_ok
            and not has_high_severity
        )

        return ReviewedLesson(
            lesson=lesson,
            quality_score=score,
            dimension_scores=dims,
            issues=issues,
            approved=approved,
        )
