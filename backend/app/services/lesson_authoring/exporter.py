from pathlib import Path

from .schema import Lesson


class LessonAuthoringExporter:
    def export(self, lesson: Lesson, output_dir: str) -> str:
        path = Path(output_dir) / f"lesson.{lesson.lesson_id}.json"
        lesson.save(path)
        return str(path)
