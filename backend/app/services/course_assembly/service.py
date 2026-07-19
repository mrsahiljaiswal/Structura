from __future__ import annotations

from app.services.educational_planner.schema import CoursePlan, PlannedLesson
from app.services.lesson_review.schema import ReviewedLesson

from .exceptions import AssemblyError
from .schema import (
    AssembledChapter,
    AssembledLesson,
    AssembledModule,
    CourseStatistics,
    FinalCourse,
)

WORDS_PER_MINUTE = 200
CHARS_PER_WORD = 5


class CourseAssemblyService:
    """
    Module 10: Course Assembly Engine.

    Aggregates reviewed lessons into a final course with metadata: reading
    time, word count, statistics, and a dependency graph. No AI is used
    here - this is pure aggregation and metadata computation.
    """

    def assemble(
        self,
        plan: CoursePlan,
        reviewed_lessons_by_id: dict[str, ReviewedLesson],
    ) -> FinalCourse:
        """
        Args:
            plan: The course plan from Module 7.
            reviewed_lessons_by_id: Dict mapping lesson_id -> ReviewedLesson,
                                   containing only approved lessons.
        """
        if not reviewed_lessons_by_id:
            raise AssemblyError("Cannot assemble a course with zero approved lessons.")

        approved_ids = set(reviewed_lessons_by_id.keys())
        modules = []

        for module in plan.modules:
            chapters = []
            for chapter in module.chapters:
                assembled_lessons = []
                for planned in chapter.lessons:
                    if planned.lesson_id not in approved_ids:
                        continue
                    reviewed = reviewed_lessons_by_id[planned.lesson_id]
                    lesson = reviewed.lesson

                    word_count = self._estimate_word_count(lesson)
                    reading_time = max(1, word_count // WORDS_PER_MINUTE)

                    assembled_lessons.append(AssembledLesson(
                        lesson=lesson,
                        reading_time_minutes=reading_time,
                        word_count=word_count,
                    ))
                chapters.append(AssembledChapter(
                    chapter_id=chapter.chapter_id,
                    title=chapter.title,
                    lessons=assembled_lessons,
                ))
            modules.append(AssembledModule(
                module_id=module.module_id,
                title=module.title,
                chapters=chapters,
            ))

        statistics = self._compute_statistics(modules, reviewed_lessons_by_id)
        dependencies = self._build_dependency_graph(plan)

        return FinalCourse(
            course_title=plan.course_title,
            description=plan.description,
            modules=modules,
            statistics=statistics,
            dependencies=dependencies,
        )

    # -- metadata computation -------------------------------------------------

    @staticmethod
    def _estimate_word_count(lesson) -> int:
        """Rough estimate: count chars in main content fields and divide by avg word length."""
        content_parts = [
            lesson.overview or "",
            lesson.theory or "",
            " ".join(lesson.definitions),
            " ".join(lesson.examples),
            " ".join(lesson.analogies),
            " ".join(lesson.misconceptions),
            " ".join(lesson.applications),
            lesson.summary or "",
            " ".join(lesson.key_takeaways),
        ]
        total_chars = sum(len(p) for p in content_parts)
        return max(1, total_chars // CHARS_PER_WORD)

    @staticmethod
    def _compute_statistics(
        modules: list[AssembledModule],
        reviewed_lessons_by_id: dict[str, ReviewedLesson],
    ) -> CourseStatistics:
        lesson_ids = []
        total_word_count = 0
        total_reading_time = 0

        for module in modules:
            for chapter in module.chapters:
                for assembled_lesson in chapter.lessons:
                    lesson_ids.append(assembled_lesson.lesson.lesson_id)
                    total_word_count += assembled_lesson.word_count
                    total_reading_time += assembled_lesson.reading_time_minutes

        quality_scores = [
            reviewed_lessons_by_id[lid].quality_score for lid in lesson_ids
            if lid in reviewed_lessons_by_id
        ]
        avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else None

        return CourseStatistics(
            total_lessons=len(lesson_ids),
            total_word_count=total_word_count,
            total_reading_time_minutes=total_reading_time,
            average_quality_score=avg_quality,
        )

    @staticmethod
    def _build_dependency_graph(plan: CoursePlan) -> dict[str, list[str]]:
        """Map each lesson_id to its prerequisite lesson_ids per the plan."""
        deps: dict[str, list[str]] = {}
        for module in plan.modules:
            for chapter in module.chapters:
                for lesson in chapter.lessons:
                    deps[lesson.lesson_id] = sorted(lesson.prerequisites)
        return deps
