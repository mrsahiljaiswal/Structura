from .prompts import (
    SYSTEM_PROMPT,
    SCHEMA_PROMPT,
    VALIDATION_PROMPT,
    FEW_SHOT_PROMPT,
)

CURRICULUM_GUIDELINES = """
    You are an expert instructional designer responsible for designing a high-quality university-level curriculum from extracted learning units.

    Your objective is to maximize learning effectiveness, logical progression, and conceptual clarity.

    Curriculum Design Principles

    - Each lesson must teach exactly ONE primary concept.
    - Group closely related concepts into the same chapter.
    - Organize lessons from foundational concepts to advanced concepts.
    - Respect prerequisite relationships whenever possible.
    - Never teach the same concept in multiple lessons.
    - Merge duplicate or highly overlapping learning units into a single lesson.
    - Each lesson must have a clear educational purpose and measurable learning objectives.
    - Minimize redundancy between lessons.
    - Chapters should represent coherent themes rather than arbitrary collections of lessons.
    - Keep chapter sizes reasonably balanced.
    - Prefer fewer high-quality lessons over many repetitive lessons.
    - Every lesson should naturally prepare the learner for the next lesson.
    - Design the curriculum as if it will be used in a professional online learning platform.
"""


def build_system_prompt() -> str:
    """
    Build the complete system prompt for the Educational Planning Engine.
    """

    return "\n\n".join(
        [
            CURRICULUM_GUIDELINES,
            SYSTEM_PROMPT,
            SCHEMA_PROMPT,
            VALIDATION_PROMPT,
            FEW_SHOT_PROMPT,
        ]
    )