from __future__ import annotations

from dataclasses import dataclass, field

from app.common.schema_base import JSONArtifact
from app.services.lesson_authoring.schema import Lesson


@dataclass
class ReviewIssue:
    category: str  # grammar | flow | hallucination | missing_concept | redundancy | difficulty | consistency
    severity: str  # low | medium | high
    description: str


@dataclass
class ReviewedLesson(JSONArtifact):
    lesson: Lesson
    quality_score: int  # 0-100
    issues: list[ReviewIssue] = field(default_factory=list)
    approved: bool = False

    @classmethod
    def from_dict(cls, data: dict) -> "ReviewedLesson":
        lesson = Lesson(**data["lesson"])
        issues = [ReviewIssue(**i) for i in data.get("issues", [])]
        return cls(lesson=lesson, quality_score=data["quality_score"], issues=issues,
                    approved=data.get("approved", False))
