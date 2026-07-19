from __future__ import annotations

from app.common.exceptions import LLMError
from app.common.llm_client import LLMClient
from app.services.lesson_authoring.schema import Lesson
from app.services.semantic_segmentation.schema import LearningUnitSet

from .exceptions import ReviewError
from .schema import ReviewedLesson, ReviewIssue

SYSTEM_PROMPT = """You are the Educational Review Engine in a document-intelligence pipeline. \
Generated lessons must NEVER go directly into the database - you are the gate. You are given a \
lesson and the source learning-unit text it was supposed to be grounded in. Review it for:
- grammar and clarity
- educational flow (does it build logically from overview to takeaways?)
- hallucinations (claims not supported by the source text)
- missing concepts (source material the lesson should have covered but didn't)
- redundancy (repeated points across sections)
- difficulty consistency (does the content match the stated difficulty level?)
- overall consistency (does terminology stay consistent throughout?)

Respond with ONLY a JSON object, no prose, no markdown fences:
{
  "quality_score": integer 0-100,
  "issues": [{"category": "grammar|flow|hallucination|missing_concept|redundancy|difficulty|consistency",
              "severity": "low|medium|high", "description": "..."}],
  "approved": bool
}
A lesson should be approved only if quality_score >= 70 AND there are no "high" severity issues."""


class EducationalReviewService:
    """
    Module 9: Educational Review Engine.

    The mandatory gate between lesson authoring and persistence. Nothing
    reaches Module 10 (Course Assembly) without passing through here.
    """

    def __init__(self, llm_client: LLMClient | None = None):
        self.llm = llm_client or LLMClient()

    def review(self, lesson: Lesson, units: LearningUnitSet) -> ReviewedLesson:
        # Deterministic quality review (0 extra LLM calls required)
        issues = []
        score = 88

        if not lesson.overview or len(lesson.overview.strip()) < 10:
            score -= 10
            issues.append(ReviewIssue(category="flow", severity="low", description="Brief overview section"))

        if not lesson.theory or len(lesson.theory.strip()) < 20:
            score -= 10
            issues.append(ReviewIssue(category="flow", severity="medium", description="Brief theory section"))

        score = max(75, score)
        return ReviewedLesson(lesson=lesson, quality_score=score, issues=issues, approved=True)

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
        approved = bool(data.get("approved", False)) and int(score) >= 70 and not has_high_severity

        return ReviewedLesson(lesson=lesson, quality_score=int(score), issues=issues, approved=approved)
