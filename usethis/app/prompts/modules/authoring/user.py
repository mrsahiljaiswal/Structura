"""
modules/authoring/user.py
===========================
Purpose: USER prompt template for Module 8, extracted from
`LessonAuthoringService._build_prompt`. Pure templating — the service
still gathers `source_units` and `prereq_titles`.
"""

from __future__ import annotations


def build_authoring_user_prompt(*, lesson_title: str, learning_objectives: list[str],
                                  difficulty: str, prerequisite_titles: list[str],
                                  units_text: str) -> str:
    objectives = "\n".join(f"- {obj}" for obj in learning_objectives)
    prereqs = ", ".join(prerequisite_titles) if prerequisite_titles else "None"
    return f"""Lesson Title:
{lesson_title}

Learning Objectives:
{objectives}

Difficulty:
{difficulty}

Previously Covered Lessons:
{prereqs}

Assume the learner already understands the concepts taught in these lessons. Do NOT
re-explain those concepts; only reference them briefly when necessary. Your goal is to
teach only the NEW knowledge introduced in this lesson.

Source Material

{units_text}"""
