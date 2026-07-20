from __future__ import annotations

from .schema import CoursePlan


VALID_DIFFICULTIES = {
    "Beginner",
    "Intermediate",
    "Advanced",
}


class PlanningValidationError(Exception):
    """Raised when a generated course plan is invalid."""


class EducationalPlanningValidator:

    def validate(self, plan: CoursePlan) -> None:
        self._validate_course(plan)
        self._validate_modules(plan)
        self._validate_prerequisites(plan)

    # ------------------------------------------------------------------ #
    # Course
    # ------------------------------------------------------------------ #

    def _validate_course(self, plan: CoursePlan):

        if not plan.course_title.strip():
            raise PlanningValidationError("Course title cannot be empty.")

        if not plan.modules:
            raise PlanningValidationError("Course must contain at least one module.")

    # ------------------------------------------------------------------ #
    # Modules / Chapters / Lessons
    # ------------------------------------------------------------------ #

    def _validate_modules(self, plan: CoursePlan):

        module_ids = set()

        for module in plan.modules:

            if module.module_id in module_ids:
                raise PlanningValidationError(
                    f"Duplicate module id: {module.module_id}"
                )

            module_ids.add(module.module_id)

            if not module.title.strip():
                raise PlanningValidationError(
                    f"Module '{module.module_id}' has an empty title."
                )

            if not module.chapters:
                raise PlanningValidationError(
                    f"Module '{module.title}' contains no chapters."
                )

            chapter_ids = set()

            for chapter in module.chapters:

                if chapter.chapter_id in chapter_ids:
                    raise PlanningValidationError(
                        f"Duplicate chapter id: {chapter.chapter_id}"
                    )

                chapter_ids.add(chapter.chapter_id)

                if not chapter.title.strip():
                    raise PlanningValidationError(
                        f"Chapter '{chapter.chapter_id}' has an empty title."
                    )

                if not chapter.lessons:
                    raise PlanningValidationError(
                        f"Chapter '{chapter.title}' contains no lessons."
                    )

                lesson_ids = set()
                lesson_titles = set()

                for lesson in chapter.lessons:

                    if lesson.lesson_id in lesson_ids:
                        raise PlanningValidationError(
                            f"Duplicate lesson id: {lesson.lesson_id}"
                        )

                    lesson_ids.add(lesson.lesson_id)

                    if lesson.title.lower() in lesson_titles:
                        raise PlanningValidationError(
                            f"Duplicate lesson title '{lesson.title}' in chapter '{chapter.title}'."
                        )

                    lesson_titles.add(lesson.title.lower())

                    if not lesson.learning_unit_ids:
                        raise PlanningValidationError(
                            f"Lesson '{lesson.title}' has no learning units."
                        )

                    if lesson.estimated_minutes <= 0:
                        raise PlanningValidationError(
                            f"Lesson '{lesson.title}' has invalid duration."
                        )

                    if lesson.difficulty not in VALID_DIFFICULTIES:
                        raise PlanningValidationError(
                            f"Lesson '{lesson.title}' has invalid difficulty '{lesson.difficulty}'."
                        )

    # ------------------------------------------------------------------ #
    # Prerequisites
    # ------------------------------------------------------------------ #

    def _validate_prerequisites(self, plan: CoursePlan):

        lesson_ids = {
            lesson.lesson_id
            for module in plan.modules
            for chapter in module.chapters
            for lesson in chapter.lessons
        }

        for module in plan.modules:
            for chapter in module.chapters:
                for lesson in chapter.lessons:

                    for prereq in lesson.prerequisites:

                        if prereq not in lesson_ids:
                            raise PlanningValidationError(
                                f"Lesson '{lesson.title}' references unknown prerequisite '{prereq}'."
                            )