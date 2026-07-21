from __future__ import annotations

from dataclasses import dataclass, field

from app.common.schema_base import JSONArtifact


@dataclass
class Lesson(JSONArtifact):
    lesson_id: str
    title: str
    overview: str
    theory: str
    definitions: list[str] = field(default_factory=list)
    examples: list[str] = field(default_factory=list)
    analogies: list[str] = field(default_factory=list)
    misconceptions: list[str] = field(default_factory=list)
    applications: list[str] = field(default_factory=list)
    summary: str = ""
    key_takeaways: list[str] = field(default_factory=list)
    learning_unit_ids: list[str] = field(default_factory=list)
    evidence_mapping: list[dict[str, str]] = field(default_factory=list)
