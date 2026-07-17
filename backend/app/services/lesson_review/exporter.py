from pathlib import Path

from .schema import ReviewedLesson


class EducationalReviewExporter:
    def export(self, reviewed: ReviewedLesson, output_dir: str) -> str:
        path = Path(output_dir) / f"reviewed_lesson.{reviewed.lesson.lesson_id}.json"
        reviewed.save(path)
        return str(path)
