from .exceptions import ReviewError
from .schema import ReviewedLesson


class EducationalReviewValidator:
    def validate(self, reviewed: ReviewedLesson) -> None:
        if not reviewed.approved:
            weakest = min(reviewed.dimension_scores.items(), key=lambda kv: kv[1], default=(None, None))
            high_severity = [i.description for i in reviewed.issues if i.severity == "high"]
            raise ReviewError(
                f"Lesson '{reviewed.lesson.lesson_id}' was not approved "
                f"(score={reviewed.quality_score}, weakest dimension={weakest[0]}={weakest[1]}). "
                f"High severity issues: {high_severity or 'none'}"
            )
