from .prompts import (
    SYSTEM_PROMPT,
    SCHEMA_PROMPT,
    VALIDATION_PROMPT,
    FEW_SHOT_PROMPT,
)


def build_system_prompt() -> str:
    """
    Build the complete system prompt for the Educational Planning Engine.
    """

    return "\n\n".join(
        [
            SYSTEM_PROMPT,
            SCHEMA_PROMPT,
            VALIDATION_PROMPT,
            FEW_SHOT_PROMPT,
        ]
    )