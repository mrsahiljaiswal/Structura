"""
critique/critique_framework.py
================================
Purpose
-------
v2: replaces the single ten-criteria pass/fail rubric with a weighted,
multi-dimensional rubric. The old version asked one question ("is this
grounded?") and folded flow/clarity/redundancy into a single opaque
quality_score the model produced with no visibility into WHY. That made
"score dropped from 82 to 71" undiagnosable — you couldn't tell if it was
worse examples, worse flow, or a hallucination, from the score alone.

DIMENSIONS replaces CRITIQUE_RUBRIC's flat list with named, individually
scored dimensions:
    grounding            - is every claim traceable to the source?
    educational_value    - does it teach, or merely restate?
    concept_accuracy     - are concepts explained correctly and precisely?
    completeness         - does it cover every objective / concept in scope?
    clarity              - is a single read enough to understand it?
    pedagogy             - progression, terminology consistency, engagement
    flow                 - does it move naturally intro -> conclusion?
    examples_and_analogies - present, grounded, and load-bearing (not decorative)
    learning_objectives  - are objectives addressed AND independently checkable?

Each dimension gets its own 0-100 score + issue list; `build_weighted_score()`
computes the single number a validator can still gate on, but the
per-dimension scores now travel with it so the pipeline can log *why* a
lesson scored what it did (feeds Priority 10 / observability directly).

Backward compatibility: `CRITIQUE_RUBRIC` (v1) is kept below, unused by any
current module.py, for anything mid-migration that still imports it.

Imported by: modules/review/system.py
"""

from __future__ import annotations

# -- v1, retained only for anything not yet migrated -------------------------

CRITIQUE_RUBRIC = """QUALITY RUBRIC
Score the content against each of the following. A single "high" severity \
finding on any criterion should weigh heavily against approval even if \
every other criterion is strong.

1. Accuracy — every factual statement is supported by the source material.
2. Completeness — every important concept belonging to this scope is covered.
3. Educational Flow — the content progresses naturally from introduction \
to conclusion.
4. Logical Progression — concepts are introduced before they are referenced.
5. Clarity — explanations are easy to understand on a single read.
6. Readability — language is appropriate for the stated audience level.
7. Redundancy — no repeated explanations or unnecessary duplication.
8. Consistency — terminology stays consistent throughout.
9. Engagement — the content teaches rather than merely summarizes source text.
10. Prerequisite Hygiene — the content does not re-teach what a \
prerequisite already covered."""

# -- v2: weighted multi-dimensional rubric -----------------------------------

DIMENSIONS: dict[str, dict] = {
    "grounding": {
        "weight": 0.20,
        "question": "Is every factual claim, example, and number traceable to the source material?",
    },
    "concept_accuracy": {
        "weight": 0.15,
        "question": "Are the concepts themselves explained correctly and precisely, not just "
                     "grounded but also not oversimplified to the point of being misleading?",
    },
    "completeness": {
        "weight": 0.15,
        "question": "Does the lesson cover every stated learning objective and every important "
                     "concept belonging to its scope, with nothing critical left implicit?",
    },
    "educational_value": {
        "weight": 0.15,
        "question": "Does this teach — build understanding the learner didn't have — or does "
                     "it just restate the source material in a different order?",
    },
    "pedagogy": {
        "weight": 0.10,
        "question": "Does it progress from simple to complex, introduce terms before using "
                     "them, keep terminology consistent, and avoid re-teaching prerequisites?",
    },
    "clarity": {
        "weight": 0.10,
        "question": "Would a motivated student understand this on a single read, without "
                     "outside help?",
    },
    "flow": {
        "weight": 0.05,
        "question": "Does the lesson move naturally from introduction to conclusion, without "
                     "abrupt jumps or unnecessary repetition?",
    },
    "examples_and_analogies": {
        "weight": 0.05,
        "question": "Are examples and analogies present where genuinely needed, grounded in "
                     "the source, and load-bearing (they clarify the concept) rather than "
                     "decorative?",
    },
    "learning_objectives": {
        "weight": 0.05,
        "question": "Is each learning objective not just mentioned, but addressed in a way a "
                     "learner could self-check ('could I now do/explain X')?",
    },
}

assert abs(sum(d["weight"] for d in DIMENSIONS.values()) - 1.0) < 1e-9, (
    "DIMENSIONS weights must sum to 1.0 — update this assertion's neighbors if you add or "
    "reweight a dimension, so a silent miscalibration can't ship."
)


def build_dimensions_prompt() -> str:
    lines = ["MULTI-DIMENSIONAL QUALITY RUBRIC",
             "Score EACH dimension independently from 0-100. Do not let a strong score on one "
             "dimension inflate another — a lesson can be perfectly grounded (100) while being "
             "poor pedagogy (40) if it dumps facts without building understanding.", ""]
    for name, spec in DIMENSIONS.items():
        lines.append(f"- {name} (weight {spec['weight']}): {spec['question']}")
    return "\n".join(lines)


def build_weighted_score_instruction() -> str:
    return (
        "OVERALL SCORE\n"
        "Compute `quality_score` as the weighted sum of your dimension scores using the "
        "weights above (e.g. grounding*0.20 + concept_accuracy*0.15 + ...), rounded to the "
        "nearest integer. Do not pick `quality_score` independently of the dimension scores — "
        "it must be arithmetically derivable from them, since a downstream validator "
        "recomputes it and will treat a mismatch as a sign the review itself is unreliable."
    )


def recompute_weighted_score(dimension_scores: dict[str, int]) -> float:
    """
    Server-side recomputation of the weighted score from a model's own
    per-dimension scores, so `quality_score` is never trusted purely on the
    model's arithmetic. Call this in EducationalReviewValidator; raise if it
    diverges from the model's reported `quality_score` by more than a small
    tolerance (a large divergence suggests the model didn't actually use its
    own dimension scores to produce the top-line number).
    """
    missing = set(DIMENSIONS) - set(dimension_scores)
    if missing:
        raise ValueError(f"Review response missing dimension scores for: {sorted(missing)}")
    return sum(dimension_scores[name] * DIMENSIONS[name]["weight"] for name in DIMENSIONS)


def build_approval_policy(*, min_score: int, disqualifying_severity: str = "high",
                           min_grounding_score: int = 60) -> str:
    """
    v2 adds a per-dimension floor on `grounding` specifically: a lesson
    should never be approved on a high overall score if it's propping that
    average up while failing grounding, since a hallucinated fact is worse
    than a slightly awkward transition sentence and averaging can hide that.
    """
    return (
        f"APPROVAL POLICY\n"
        f"Approve only if:\n"
        f"- the weighted quality_score is at least {min_score}, AND\n"
        f"- the grounding dimension score is at least {min_grounding_score} on its own "
        f"(a lesson cannot buy its way past a grounding failure with strong writing), AND\n"
        f"- there are no '{disqualifying_severity}' severity issues.\n"
        f"State your own approved/rejected verdict honestly even if it feels harsh — a "
        f"downstream validator enforces this floor in code regardless of what you decide."
    )
