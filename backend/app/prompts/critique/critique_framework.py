"""
critique/critique_framework.py
================================
Purpose
-------
The shared criteria set for judging teaching content, used today by
Educational Review (Module 9) but written generically so a future
module — e.g. a standalone "Quiz Quality Reviewer" or a second review pass
over Course Assembly output — can reuse the same ten-criteria rubric
instead of writing a new one from scratch.

This is distinct from `anti_hallucination.grounding.ANTI_HALLUCINATION_JUDGING`
(fact-grounding specifically) and `shared.lesson_completeness` (did the
author cover everything) — this file is the broader pedagogical rubric:
flow, clarity, redundancy, consistency, engagement, prerequisite hygiene.

Imported by: modules/review/system.py
"""

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


def build_approval_policy(*, min_score: int, disqualifying_severity: str = "high") -> str:
    """
    Render the pass/fail policy for a critique pass. Kept as a function
    (not a constant) because different critique consumers may want
    different thresholds — Review currently uses min_score=70,
    disqualifying_severity="high"; a lighter-weight internal QA pass might
    use a lower bar.
    """
    return (
        f"APPROVAL POLICY\n"
        f"Approve only if the overall quality score is at least {min_score} "
        f"AND there are no '{disqualifying_severity}' severity issues. "
        f"State your own approved/rejected verdict honestly even if it feels "
        f"harsh — a downstream system enforces this floor in code regardless "
        f"of what you decide, so there is no benefit to inflating a score."
    )
