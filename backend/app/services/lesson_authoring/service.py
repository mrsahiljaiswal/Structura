from __future__ import annotations

from app.common.exceptions import LLMError
from app.common.llm_client import LLMClient
from app.services.educational_planner.schema import CoursePlan, PlannedLesson
from app.services.semantic_segmentation.schema import LearningUnit, LearningUnitSet

from .exceptions import LessonAuthoringError
from .schema import Lesson

SYSTEM_PROMPT = """You are the Verbatim Structuring & Lesson Authoring Engine in a document-intelligence pipeline.

STRICT VERBATIM PRESERVATION & STRUCTURAL CATEGORIZATION DIRECTIVE:
1. You are provided with the COMPLETE source text extracted from the uploaded PDF document for this lesson.
2. Your ONLY job is to categorize, organize, and format the COMPLETE source text into structured Markdown headings, chapters, and bullet points.
3. ABSOLUTELY NO TEXT OMISSION, DEDUCTION, OR SHORTENING: You MUST include EACH AND EVERY sentence, detail, word, code block, formula, and point from the source text. DO NOT summarize away details or omit paragraphs.
4. ABSOLUTELY NO NEW TEXT OR OUTSIDE GENERATION: Do NOT invent outside examples, extra ungrounded analogies, or new commentary. Retain the exact facts and wording from the PDF.
5. 100% TEXT PRESERVATION: The 'theory' section MUST contain the complete, unabridged, comprehensive content of the source PDF section.

Respond with ONLY a JSON object, no prose, no markdown fences:
{
  "overview": "Direct, comprehensive overview framing the PDF section text",
  "theory": "COMPLETE UNABRIDGED VERBATIM SOURCE PDF TEXT, fully categorized and formatted into structured Markdown headings without omitting any words, facts, or details",
  "definitions": ["exact term: definition directly from PDF text", "..."],
  "examples": ["worked example or code block directly from PDF text", "..."],
  "analogies": ["exact analogy from PDF text if present, else []"],
  "misconceptions": ["exact misconception from PDF text if present, else []"],
  "applications": ["exact application from PDF text if present, else []"],
  "summary": "Full section summary directly from PDF text",
  "key_takeaways": ["exact key takeaway points directly from PDF text", "..."]
}"""


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
        units_text = "\n\n".join(
            f"--- Learning unit: {u.topic} ---\nSummary: {u.summary}\nKeywords: {', '.join(u.keywords)}\n\n{u.text}"
            for u in source_units
        )
        return (
            f"Lesson title: {planned_lesson.title}\n"
            f"Learning objectives: {planned_lesson.learning_objectives}\n"
            f"Difficulty: {planned_lesson.difficulty}\n"
            f"Prerequisite lessons already completed: {prereq_titles}\n\n"
            f"{units_text}"
        )

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
