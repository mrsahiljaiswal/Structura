"""
modules/review/system.py
==========================
v2 — implements Priority 1 from the maturity review: the reviewer stops
behaving like a fact-checker with one opaque score and instead scores
grounding, concept accuracy, completeness, educational value, pedagogy,
clarity, flow, examples/analogies, and learning-objective coverage
independently, then a weighted overall score is DERIVED from those (not
picked freestanding by the model — see critique_framework.recompute_weighted_score,
which the validator should call server-side).

This requires a schema change in `app/services/educational_review/schema.py`
(see INTEGRATION_GUIDE.md step 2) — `ReviewedLesson` needs a
`dimension_scores: dict[str, int]` field alongside the existing
`quality_score`, `issues`, `approved`. This file assumes that field exists.

Composition: philosophy + role + multi-dimensional rubric (replaces flat
CRITIQUE_RUBRIC) + lesson_completeness + writing_style (tone bar) +
anti-hallucination JUDGING + JSON rules.
"""

from app.prompts.base.philosophy import EDUCATIONAL_PHILOSOPHY
from app.prompts.base.roles import ROLE_REVIEW
from app.prompts.base.prompt_sections import PromptSection, assemble
from app.prompts.shared.writing_style import WRITING_STYLE_GUIDE
from app.prompts.shared.lesson_completeness import LESSON_COMPLETENESS_CHECKLIST
from app.prompts.anti_hallucination.grounding import ANTI_HALLUCINATION_JUDGING
from app.prompts.critique.critique_framework import (
    DIMENSIONS,
    build_dimensions_prompt,
    build_weighted_score_instruction,
    build_approval_policy,
)
from app.prompts.json.json_rules import STRICT_JSON_OUTPUT_RULES, render_json_schema
from app.prompts.validation.self_check import build_self_check

MIN_APPROVAL_SCORE = 70
MIN_GROUNDING_SCORE = 60

_SCHEMA = {
    "dimension_scores": {name: "integer 0-100" for name in DIMENSIONS},
    "quality_score": "integer 0-100, the weighted sum of dimension_scores (see OUTPUT RULES)",
    "issues": [
        {
            "category": "grounding|concept_accuracy|completeness|educational_value|pedagogy"
                         "|clarity|flow|examples|learning_objectives",
            "severity": "low|medium|high",
            "dimension": f"one of {list(DIMENSIONS)} — which dimension this issue lowers",
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
            "Score the given lesson across every rubric dimension independently, derive a "
            "weighted overall score from those dimensions, list issues tagged to the "
            "dimension they affect, and render an approve/reject verdict.",
        ),
        PromptSection(
            "CONSTRAINTS",
            f"{build_dimensions_prompt()}\n\n{LESSON_COMPLETENESS_CHECKLIST}\n\n"
            f"Judge tone and terminology against this style bar, since it's what the author "
            f"was instructed to write toward:\n{WRITING_STYLE_GUIDE}\n\n"
            f"{build_approval_policy(min_score=MIN_APPROVAL_SCORE, min_grounding_score=MIN_GROUNDING_SCORE)}",
        ),
        PromptSection("ANTI_HALLUCINATION", ANTI_HALLUCINATION_JUDGING),
        PromptSection(
            "OUTPUT_RULES",
            f"{STRICT_JSON_OUTPUT_RULES}\n\n{build_weighted_score_instruction()}\n\n"
            f"{render_json_schema(_SCHEMA, title='ReviewedLesson v2')}",
        ),
        PromptSection(
            "SELF_CHECK",
            build_self_check(
                "Did I score each dimension independently, or did one bad/good impression "
                "bleed into every score (halo effect)?",
                "Is my quality_score actually the weighted sum of my own dimension scores?",
                "Am I approving this because it genuinely clears the bar, or because "
                "rejecting feels harsh?",
            ),
        ),
    )
