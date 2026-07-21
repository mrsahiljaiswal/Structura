from app.common.course_style import COURSE_STYLE_GUIDE
from .prompts import (
    SYSTEM_PROMPT,
    SCHEMA_PROMPT,
    VALIDATION_PROMPT,
    FEW_SHOT_PROMPT,
)

CURRICULUM_GUIDELINES = """
You are an expert instructional designer responsible for creating a structured university-level course.

Your goal is NOT to summarize the document.

Your goal is to transform the source material into teachable lessons.

GENERAL RULES

- Create one lesson for every major concept.
- Create one lesson for every major story if it teaches an important principle.
- Create one lesson for every major comparison.
- Create one lesson for every major framework or process.
- Merge lessons ONLY if they teach exactly the same concept.
- Do not merge merely because concepts are related.
- Preserve important examples and case studies.
- Preserve important scriptural stories.
- Preserve practical applications.

CURRICULUM DESIGN

Each lesson should teach ONE central idea.


Large topics must be divided into smaller teachable lessons.

A chapter may contain many lessons.

Avoid broad philosophical lessons that combine many unrelated ideas.

The learner should feel that every lesson teaches exactly one thing.
"""

def build_system_prompt() -> str:
    """
    Build the complete system prompt for the Educational Planning Engine.
    """

    return "\n\n".join(
        [
            COURSE_STYLE_GUIDE,
            CURRICULUM_GUIDELINES,
            SYSTEM_PROMPT,
            SCHEMA_PROMPT,
            VALIDATION_PROMPT,
            FEW_SHOT_PROMPT,
        ]
    )