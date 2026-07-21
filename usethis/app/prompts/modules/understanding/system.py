"""
modules/understanding/system.py
=================================
Purpose: SYSTEM_PROMPT for Module 3 (Document Understanding). Replaces the
hardcoded SYSTEM_PROMPT string in
`app/services/document_understanding/service.py`.

Composition: philosophy + role only. No cognitive-load/Bloom's/writing
style — classification isn't teaching content, and pulling those in would
be dead weight tokens with zero effect on this task. This is a deliberate
example of a module that does NOT import every shared block; not every
module needs everything.

What services import this: document_understanding/service.py imports
`build_understanding_system_prompt()` and calls it once at class-init
time (the prompt is static per call, no per-document templating needed
here — unlike Authoring, which needs the source text templated in).
"""

from app.prompts.base.philosophy import EDUCATIONAL_PHILOSOPHY
from app.prompts.base.roles import ROLE_UNDERSTANDING
from app.prompts.base.prompt_sections import PromptSection, assemble
from app.prompts.json.json_rules import STRICT_JSON_OUTPUT_RULES, render_json_schema
from app.prompts.validation.self_check import build_self_check

ALLOWED_TYPES = (
    "book", "research_paper", "resume", "lecture_notes",
    "documentation", "novel", "specification", "slides",
)

_SCHEMA = {
    "document_type": f"one of {list(ALLOWED_TYPES)}",
    "language": "ISO 639-1 code, e.g. en",
    "title": "string or null",
    "author": "string or null",
    "publisher": "string or null",
    "edition": "string or null",
    "isbn": "string or null",
    "has_preface": "bool",
    "has_acknowledgements": "bool",
    "has_copyright_page": "bool",
    "has_table_of_contents": "bool",
    "has_index": "bool",
    "has_bibliography": "bool",
    "has_appendix": "bool",
    "has_references": "bool",
    "confidence": "float between 0 and 1",
}


def build_understanding_system_prompt() -> str:
    return assemble(
        PromptSection("ROLE", f"{EDUCATIONAL_PHILOSOPHY}\n\n{ROLE_UNDERSTANDING}"),
        PromptSection(
            "MISSION",
            "Classify the document type and extract bibliographic metadata from the "
            "front/back matter sample you are given. Do not summarize content or extract "
            "concepts — later stages do that.",
        ),
        PromptSection(
            "CONSTRAINTS",
            f"`document_type` must be exactly one of: {', '.join(ALLOWED_TYPES)}. "
            "If genuinely uncertain between two types, pick the more specific one "
            "(e.g. `research_paper` over `documentation` for an academic PDF) and reflect "
            "the uncertainty in a lower `confidence`, not by inventing a hybrid type.",
        ),
        PromptSection(
            "OUTPUT_RULES",
            f"{STRICT_JSON_OUTPUT_RULES}\n\n{render_json_schema(_SCHEMA, title='DocumentProfile')}",
        ),
        PromptSection(
            "SELF_CHECK",
            build_self_check(
                "Is my confidence score honest, not just defaulted to a high number?",
            ),
        ),
    )
