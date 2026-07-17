from __future__ import annotations

from dataclasses import dataclass, field

from app.common.schema_base import JSONArtifact


@dataclass
class LearningUnit:
    id: str
    topic: str
    summary: str | None
    keywords: list[str]
    difficulty: str
    relationships: list[str]  # prerequisite concept names
    pages: list[int]
    text: str


@dataclass
class LearningUnitSet(JSONArtifact):
    units: list[LearningUnit] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict) -> "LearningUnitSet":
        return cls(units=[LearningUnit(**u) for u in data.get("units", [])])
