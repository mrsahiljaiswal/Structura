from __future__ import annotations

from dataclasses import dataclass, field

from app.common.schema_base import JSONArtifact


@dataclass
class PlannedLesson:
    lesson_id: str
    title: str
    learning_unit_ids: list[str]
    learning_objectives: list[str]
    estimated_minutes: int
    difficulty: str
    prerequisites: list[str]  # other lesson_ids


@dataclass
class PlannedChapter:
    chapter_id: str
    title: str
    lessons: list[PlannedLesson] = field(default_factory=list)


@dataclass
class PlannedModule:
    module_id: str
    title: str
    chapters: list[PlannedChapter] = field(default_factory=list)


@dataclass
class CoursePlan(JSONArtifact):
    course_title: str
    description: str
    modules: list[PlannedModule] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict) -> "CoursePlan":
        modules = []
        for m in data.get("modules", []):
            chapters = []
            for ch in m.get("chapters", []):
                lessons = [PlannedLesson(**l) for l in ch.get("lessons", [])]
                chapters.append(PlannedChapter(chapter_id=ch["chapter_id"], title=ch["title"], lessons=lessons))
            modules.append(PlannedModule(module_id=m["module_id"], title=m["title"], chapters=chapters))
        return cls(course_title=data["course_title"], description=data.get("description", ""), modules=modules)
