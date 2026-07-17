from .exceptions import LessonAuthoringError
from .schema import Lesson

MIN_THEORY_LENGTH = 40


class LessonAuthoringValidator:
    def validate(self, lesson: Lesson) -> None:
        if not lesson.overview.strip():
            raise LessonAuthoringError(f"Lesson '{lesson.lesson_id}' has an empty overview.")
        if len(lesson.theory.strip()) < MIN_THEORY_LENGTH:
            raise LessonAuthoringError(
                f"Lesson '{lesson.lesson_id}' theory section is suspiciously short "
                f"({len(lesson.theory)} chars) - likely a degenerate LLM response."
            )
        if not lesson.key_takeaways:
            raise LessonAuthoringError(f"Lesson '{lesson.lesson_id}' has no key takeaways.")
