from __future__ import annotations

from dataclasses import dataclass, field

from app.common.schema_base import JSONArtifact
from app.services.lesson_authoring.schema import Lesson


@dataclass
class AssembledLesson:
    lesson: Lesson
    reading_time_minutes: int
    word_count: int


@dataclass
class AssembledChapter:
    chapter_id: str
    title: str
    lessons: list[AssembledLesson] = field(default_factory=list)


@dataclass
class AssembledModule:
    module_id: str
    title: str
    chapters: list[AssembledChapter] = field(default_factory=list)


@dataclass
class CourseStatistics:
    total_lessons: int
    total_word_count: int
    total_reading_time_minutes: int
    average_quality_score: float | None = None


@dataclass
class FinalCourse(JSONArtifact):
    course_title: str
    description: str
    modules: list[AssembledModule] = field(default_factory=list)
    statistics: CourseStatistics = None
    dependencies: dict[str, list[str]] = field(default_factory=dict)  # lesson_id -> prerequisite lesson_ids

    @classmethod
    def from_dict(cls, data: dict) -> "FinalCourse":
        modules = []
        for m in data.get("modules", []):
            chapters = []
            for ch in m.get("chapters", []):
                lessons = []
                for l in ch.get("lessons", []):
                    lessons.append(AssembledLesson(
                        lesson=Lesson(**l["lesson"]),
                        reading_time_minutes=l["reading_time_minutes"],
                        word_count=l["word_count"],
                    ))
                chapters.append(AssembledChapter(chapter_id=ch["chapter_id"], title=ch["title"], lessons=lessons))
            modules.append(AssembledModule(module_id=m["module_id"], title=m["title"], chapters=chapters))
        stats = CourseStatistics(**data["statistics"]) if data.get("statistics") else None
        return cls(course_title=data["course_title"], description=data.get("description", ""),
                    modules=modules, statistics=stats, dependencies=data.get("dependencies", {}))
