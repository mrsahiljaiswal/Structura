from __future__ import annotations

from dataclasses import dataclass, field

from app.common.schema_base import JSONArtifact
from app.services.lesson_authoring.schema import Lesson


@dataclass
class ReviewIssue:
    category: str  # grammar | flow | hallucination | missing_concept | redundancy | difficulty | consistency
    severity: str  # low | medium | high
    description: str
    dimension: str | None = None
    unsupported_claim: str | None = None
    suggested_correction: str | None = None


@dataclass
class ReviewedLesson(JSONArtifact):
    lesson: Lesson
    quality_score: int  # 0-100
    dimension_scores: dict[str, int] = field(default_factory=dict)
    issues: list[ReviewIssue] = field(default_factory=list)
    approved: bool = False

    @classmethod
    def from_dict(cls, data: dict) -> "ReviewedLesson":
        lesson = Lesson(**data["lesson"]) if isinstance(data.get("lesson"), dict) else data["lesson"]
        issues = [
            ReviewIssue(
                category=i.get("category", "flow"),
                severity=i.get("severity", "low"),
                description=i.get("description", ""),
                dimension=i.get("dimension"),
                unsupported_claim=i.get("unsupported_claim"),
                suggested_correction=i.get("suggested_correction"),
            )
            for i in data.get("issues", [])
        ]
        return cls(lesson=lesson, quality_score=data["quality_score"],
                    dimension_scores=data.get("dimension_scores", {}), issues=issues,
                    approved=data.get("approved", False))
