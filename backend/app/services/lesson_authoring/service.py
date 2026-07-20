from __future__ import annotations

from app.common.exceptions import LLMError
from app.common.llm_client import LLMClient
from app.services.educational_planner.schema import CoursePlan, PlannedLesson
from app.services.semantic_segmentation.schema import LearningUnit, LearningUnitSet

from .exceptions import LessonAuthoringError
from .schema import Lesson

SYSTEM_PROMPT = """
You are the Lesson Authoring Engine for an AI-powered educational platform.

Your task is to transform the provided source material into a well-structured lesson.

STRICT RULES

1. Use ONLY the provided source material.
2. Never invent facts, examples, analogies or definitions.
3. Preserve all important concepts required for this lesson.
4. DO NOT repeat concepts already covered in prerequisite lessons.
5. Focus ONLY on the current lesson objectives.
6. If the source contains unrelated information, ignore it.
7. Organize the lesson using meaningful Markdown headings (##, ###).
8. Merge repeated explanations into one comprehensive explanation.
9. Improve readability while preserving meaning.
10. Keep technical terms exactly as they appear.

Return ONLY JSON.

{
  "overview": "...",
  "theory": "...",
  "definitions": [],
  "examples": [],
  "analogies": [],
  "misconceptions": [],
  "applications": [],
  "summary": "...",
  "key_takeaways": []
}
"""


class LessonAuthoringService:
    """
    Module 8: Lesson Authoring Engine. Second major AI module.

    Every lesson is authored independently: this service takes one
    `PlannedLesson` plus its source `LearningUnit`s (and optionally the
    titles of prerequisite lessons, for tone/context continuity) and
    generates full lesson content. It never sees the rest of the course,
    which is what keeps this module trivially parallelizable and testable
    in isolation.
    """

    def __init__(self, llm_client: LLMClient | None = None):
        self.llm = llm_client or LLMClient()

    def author(
        self,
        planned_lesson: PlannedLesson,
        units: LearningUnitSet,
        prerequisite_titles: list[str] | None = None,
    ) -> Lesson:
        source_units = [u for u in units.units if u.id in planned_lesson.learning_unit_ids]
        if not source_units:
            raise LessonAuthoringError(
                f"Lesson '{planned_lesson.title}' references no matching learning units."
            )

        prompt = self._build_prompt(planned_lesson, source_units, prerequisite_titles or [])
        try:
            data = self.llm.complete_json(SYSTEM_PROMPT, prompt)
        except LLMError as e:
            raise LessonAuthoringError(f"Failed to author lesson '{planned_lesson.title}': {e}") from e

        return self._to_lesson(planned_lesson, data)

    def author_all(self, plan: CoursePlan, units: LearningUnitSet) -> list[Lesson]:
        """Convenience: author every lesson in a course plan, one independent call each."""
        lesson_titles_by_id = {
            lesson.lesson_id: lesson.title
            for module in plan.modules for chapter in module.chapters for lesson in chapter.lessons
        }
        lessons: list[Lesson] = []
        for module in plan.modules:
            for chapter in module.chapters:
                for planned in chapter.lessons:
                    prereq_titles = [lesson_titles_by_id[p] for p in planned.prerequisites if p in lesson_titles_by_id]
                    lessons.append(self.author(planned, units, prereq_titles))
        return lessons

    @staticmethod
    def _build_prompt(planned_lesson: PlannedLesson, source_units: list[LearningUnit], prereq_titles: list[str]) -> str:
        @staticmethod
        def _build_prompt(
            planned_lesson: PlannedLesson,
            source_units: list[LearningUnit],
            prereq_titles: list[str],
        ) -> str:

            units_text = "\n\n".join(
                f"""
        ### Learning Unit

        Topic:
        {u.topic}

        Summary:
        {u.summary}

        Keywords:
        {", ".join(u.keywords)}

        Content:
        {u.text}
        """
                for u in source_units
            )

            objectives = "\n".join(
                f"- {obj}" for obj in planned_lesson.learning_objectives
            )

            prereqs = ", ".join(prereq_titles) if prereq_titles else "None"

            return f"""
        Lesson Title:
        {planned_lesson.title}

        Learning Objectives:
        {objectives}

        Difficulty:
        {planned_lesson.difficulty}

        Previously Covered Lessons:
        {prereqs}

        Instructions:

        - Write ONLY about this lesson.
        - Cover ALL learning objectives.
        - Ignore unrelated content.
        - Merge duplicate explanations into one.
        - Do NOT repeat concepts already covered in prerequisite lessons.
        - Preserve factual accuracy.
        - Improve grammar and readability.
        - Organize the lesson with Markdown headings (##, ###).

        Source Material

        {units_text}
        """

    @staticmethod
    def _to_lesson(planned_lesson: PlannedLesson, data: dict) -> Lesson:
        required = ["overview", "theory"]
        missing = [k for k in required if not data.get(k)]
        if missing:
            raise LessonAuthoringError(
                f"Lesson '{planned_lesson.title}' response missing required fields: {missing}"
            )
        return Lesson(
            lesson_id=planned_lesson.lesson_id,
            title=planned_lesson.title,
            overview=data["overview"],
            theory=data["theory"],
            definitions=data.get("definitions", []),
            examples=data.get("examples", []),
            analogies=data.get("analogies", []),
            misconceptions=data.get("misconceptions", []),
            applications=data.get("applications", []),
            summary=data.get("summary", ""),
            key_takeaways=data.get("key_takeaways", []),
            learning_unit_ids=planned_lesson.learning_unit_ids,
        )
