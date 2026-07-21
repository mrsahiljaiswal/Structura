"""
modules/knowledge_extraction/system.py
========================================
Purpose: SYSTEM_PROMPT for Module 5 (Knowledge Extraction). Replaces the
hardcoded SYSTEM_PROMPT in
`app/services/knowledge_extraction/service.py`.

Composition: philosophy + role + anti-hallucination (GENERATION variant —
concepts and prerequisites must come from the text, not from the model's
general knowledge of the subject) + JSON rules. No writing-style or
cognitive-load blocks: this module extracts a concept skeleton, it doesn't
write prose or decide lesson sizing.
"""

from app.prompts.base.philosophy import EDUCATIONAL_PHILOSOPHY
from app.prompts.base.roles import ROLE_KNOWLEDGE_EXTRACTION
from app.prompts.base.prompt_sections import PromptSection, assemble
from app.prompts.anti_hallucination.grounding import ANTI_HALLUCINATION_GENERATION
from app.prompts.json.json_rules import STRICT_JSON_OUTPUT_RULES, render_json_schema
from app.prompts.validation.self_check import build_self_check

VALID_DIFFICULTIES = ("beginner", "intermediate", "advanced")

_SCHEMA = {
    "concepts": [
        {
            "name": "short canonical concept name",
            "keywords": ["related terms/synonyms"],
            "definition": "one-to-two sentence definition drawn from the text, or null",
            "difficulty": f"one of {list(VALID_DIFFICULTIES)}",
            "importance": "0.0-1.0, how central this concept is to the section",
            "prerequisites": ["names of OTHER concepts a reader must understand first"],
        }
    ]
}


def build_knowledge_extraction_system_prompt() -> str:
    return assemble(
        PromptSection("ROLE", f"{EDUCATIONAL_PHILOSOPHY}\n\n{ROLE_KNOWLEDGE_EXTRACTION}"),
        PromptSection(
            "MISSION",
            "For every distinct concept in the section you are given, extract its name, "
            "keywords, definition, difficulty, importance, and prerequisites.",
        ),
        PromptSection(
            "CONSTRAINTS",
            "A prerequisite may be a concept from this section OR implied background "
            "knowledge not in the text — but only list it if the text's own logic actually "
            "depends on it, not because it's generally related to the subject. "
            "If the section has no extractable concepts (pure narrative, front matter), "
            'return {"concepts": []} rather than forcing an extraction.',
        ),
        PromptSection("ANTI_HALLUCINATION", ANTI_HALLUCINATION_GENERATION),
        PromptSection(
            "OUTPUT_RULES",
            f"{STRICT_JSON_OUTPUT_RULES}\n\n{render_json_schema(_SCHEMA, title='concept list')}",
        ),
        PromptSection(
            "SELF_CHECK",
            build_self_check(
                "Is every prerequisite I listed actually implied by this section's own text?",
                "Did I merge two genuinely distinct concepts into one, or split one concept "
                "into two for no reason?",
            ),
        ),
    )
