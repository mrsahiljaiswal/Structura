from __future__ import annotations

from typing import Any


DEFAULT_ESTIMATED_MINUTES = 15
DEFAULT_DIFFICULTY = "Beginner"


def normalize_course_plan(data: dict[str, Any]) -> dict[str, Any]:
    """
    Normalize raw LLM output into the canonical schema expected by the parser.
    """

    return {
        "course_title": data.get("course_title", ""),
        "description": data.get("description", ""),
        "modules": [
            _normalize_module(module, idx + 1)
            for idx, module in enumerate(data.get("modules", []))
        ],
    }


def _normalize_module(module: dict[str, Any], index: int) -> dict:

    return {
        "module_id": module.get("module_id", f"module-{index}"),
        "title": module.get("title") or module.get("module_title", ""),
        "chapters": [
            _normalize_chapter(ch, i + 1)
            for i, ch in enumerate(module.get("chapters", []))
        ],
    }


def _normalize_chapter(chapter: dict[str, Any], index: int) -> dict:

    return {
        "chapter_id": chapter.get("chapter_id", f"chapter-{index}"),
        "title": chapter.get("title") or chapter.get("chapter_title", ""),
        "lessons": [
            _normalize_lesson(ls, i + 1)
            for i, ls in enumerate(chapter.get("lessons", []))
        ],
    }


def _normalize_lesson(lesson: dict[str, Any], index: int) -> dict:

    return {
        "lesson_id": lesson.get("lesson_id", f"lesson-{index}"),

        "title":
            lesson.get("title")
            or lesson.get("lesson_title", ""),

        "learning_unit_ids":
            lesson.get("learning_unit_ids")
            or lesson.get("learning_units", []),

        "learning_objectives":
            lesson.get("learning_objectives", []),

        "estimated_minutes":
            lesson.get(
                "estimated_minutes",
                DEFAULT_ESTIMATED_MINUTES,
            ),

        "difficulty":
            lesson.get(
                "difficulty",
                DEFAULT_DIFFICULTY,
            ),

        "prerequisites":
            lesson.get("prerequisites", []),
    }