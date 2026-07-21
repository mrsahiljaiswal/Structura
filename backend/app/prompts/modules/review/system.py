"""
modules/review/system.py
==========================
Purpose: SYSTEM_PROMPT for Module 9 (Educational Review). Replaces the
hardcoded SYSTEM_PROMPT in `app/services/educational_review/service.py`
(previously COURSE_STYLE_GUIDE concatenated inline -- the second of the
two places COURSE_STYLE_GUIDE was duplicated).

Composition: philosophy + role + the critique rubric (not the generation
guides — Review judges against writing_style/lesson_completeness rather
than re-deriving Bloom's/cognitive-load itself, since those inform
*writing* decisions the author already made, not the reviewer's checklist)
+ anti-hallucination JUDGING variant + lesson_completeness (grading
against the same bar Authoring wrote toward) + JSON rules.
"""

from app.prompts.base.philosophy import EDUCATIONAL_PHILOSOPHY
from app.prompts.base.roles import ROLE_REVIEW
from app.prompts.base.prompt_sections import PromptSection, assemble
from app.prompts.shared.writing_style import WRITING_STYLE_GUIDE
from app.prompts.shared.lesson_completeness import LESSON_COMPLETENESS_CHECKLIST
from app.prompts.anti_hallucination.grounding import ANTI_HALLUCINATION_JUDGING
from app.prompts.critique.critique_framework import CRITIQUE_RUBRIC, build_approval_policy
from app.prompts.json.json_rules import STRICT_JSON_OUTPUT_RULES, render_json_schema
from app.prompts.validation.self_check import build_self_check

MIN_APPROVAL_SCORE = 70

_SCHEMA = {
    "quality_score": "integer 0-100",
    "issues": [
        {
            "category": "grammar|flow|hallucination|missing_concept|redundancy|difficulty|consistency",
            "severity": "low|medium|high",
            "description": "string",
        }
    ],
    "approved": "bool",
}


def build_review_system_prompt() -> str:
    return assemble(
        PromptSection("ROLE", f"{EDUCATIONAL_PHILOSOPHY}\n\n{ROLE_REVIEW}"),
        PromptSection(
            "MISSION",
            "Review the given lesson against its source material and render a quality "
            "score, a list of issues, and an approve/reject verdict.",
        ),
        PromptSection(
            "CONSTRAINTS",
            f"{CRITIQUE_RUBRIC}\n\n{LESSON_COMPLETENESS_CHECKLIST}\n\n"
            f"Judge tone and terminology against this style bar, since it's what the author "
            f"was instructed to write toward:\n{WRITING_STYLE_GUIDE}\n\n"
            f"{build_approval_policy(min_score=MIN_APPROVAL_SCORE)}",
        ),
        PromptSection("ANTI_HALLUCINATION", ANTI_HALLUCINATION_JUDGING),
        PromptSection(
            "OUTPUT_RULES",
            f"{STRICT_JSON_OUTPUT_RULES}\n\n{render_json_schema(_SCHEMA, title='ReviewedLesson')}",
        ),
        PromptSection(
            "SELF_CHECK",
            build_self_check(
                "Am I approving this because it genuinely clears the bar, or because "
                "rejecting feels harsh?",
                "Have I checked every factual claim in the lesson against the source text, "
                "not just skimmed for tone?",
            ),
        ),
    )
