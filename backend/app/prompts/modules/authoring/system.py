"""
modules/authoring/system.py
=============================
Purpose: SYSTEM_PROMPT for Module 8 (Lesson Authoring). Replaces the
hardcoded SYSTEM_PROMPT in `app/services/lesson_authoring/service.py`
(previously COURSE_STYLE_GUIDE concatenated with a long inline f-string).

Composition: this is the richest module — it imports nearly every shared
block, because writing a lesson is where philosophy, style, pedagogy, and
grounding all have to operate simultaneously.
"""

from app.prompts.base.philosophy import EDUCATIONAL_PHILOSOPHY
from app.prompts.base.roles import ROLE_AUTHORING
from app.prompts.base.prompt_sections import PromptSection, assemble
from app.prompts.shared.writing_style import WRITING_STYLE_GUIDE
from app.prompts.shared.teaching_patterns import TEACHING_PATTERNS_GUIDE
from app.prompts.shared.cognitive_load import COGNITIVE_LOAD_GUIDE
from app.prompts.shared.blooms_taxonomy import BLOOMS_GUIDE
from app.prompts.shared.story_guidelines import STORY_AND_EXAMPLE_GUIDELINES
from app.prompts.shared.lesson_completeness import LESSON_COMPLETENESS_CHECKLIST
from app.prompts.shared.formatting_rules import MARKDOWN_CONTENT_FORMATTING_RULES
from app.prompts.anti_hallucination.grounding import ANTI_HALLUCINATION_GENERATION
from app.prompts.json.json_rules import STRICT_JSON_OUTPUT_RULES, render_json_schema
from app.prompts.validation.self_check import build_self_check

_AUTHORING_CONSTRAINTS = """AUTHORING CONSTRAINTS
- Assume the learner has already completed all prerequisite lessons; do not repeat \
explanations already covered there, and reference prerequisite concepts only briefly when \
necessary.
- Cover EVERY learning objective you were given.
- Write ONLY about this lesson's scope — if the source material contains unrelated \
information, ignore it.
- Teach concepts progressively from simple to complex; explain ideas before introducing \
technical terminology for them."""

_SCHEMA = {
    "overview": "string",
    "theory": "Markdown content, ## and ### headings, introduction through explanation",
    "definitions": ["string"],
    "examples": ["string"],
    "analogies": ["string"],
    "misconceptions": ["string"],
    "applications": ["string"],
    "summary": "string",
    "key_takeaways": ["string"],
}


def build_authoring_system_prompt() -> str:
    return assemble(
        PromptSection("ROLE", f"{EDUCATIONAL_PHILOSOPHY}\n\n{ROLE_AUTHORING}"),
        PromptSection(
            "MISSION",
            "Transform the provided source material into one well-structured, fully "
            "self-contained lesson satisfying every learning objective given to you.",
        ),
        PromptSection(
            "CONSTRAINTS",
            f"{_AUTHORING_CONSTRAINTS}\n\n{STORY_AND_EXAMPLE_GUIDELINES}\n\n{LESSON_COMPLETENESS_CHECKLIST}",
        ),
        PromptSection("PROCESS", f"{COGNITIVE_LOAD_GUIDE}\n\n{BLOOMS_GUIDE}\n\n{TEACHING_PATTERNS_GUIDE}"),
        PromptSection("ANTI_HALLUCINATION", ANTI_HALLUCINATION_GENERATION),
        PromptSection(
            "OUTPUT_RULES",
            f"{WRITING_STYLE_GUIDE}\n\n{MARKDOWN_CONTENT_FORMATTING_RULES}\n\n"
            f"{STRICT_JSON_OUTPUT_RULES}\n\n{render_json_schema(_SCHEMA, title='Lesson')}",
        ),
        PromptSection(
            "SELF_CHECK",
            build_self_check(
                "Have I covered every learning objective I was given?",
                "Have I re-explained anything already covered by a prerequisite lesson?",
                "Is every example, analogy, and definition grounded in the source material "
                "I was given, not general knowledge of the subject?",
            ),
        ),
    )
