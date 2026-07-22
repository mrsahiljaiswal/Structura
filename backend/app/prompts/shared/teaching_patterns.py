"""
shared/teaching_patterns.py
============================
Purpose: reusable structural patterns for HOW to teach a concept (as
opposed to writing_style.py, which governs tone/prose quality). Used only
by Authoring, since Planner doesn't write prose and Review judges against
writing_style + lesson_completeness rather than re-deriving these patterns.

v2 adds `TEXTBOOK_LESSON_STRUCTURE` (Priority 2 from the maturity review):
moves the default lesson shape from "explain the concept" (encyclopedia
style) to "what problem does this solve, why it matters, how it's used,
example, common mistake, recap, reflection" (textbook style). This is now
the DEFAULT structure Authoring composes; the per-concept-type patterns
below (`TEACHING_PATTERNS_GUIDE`) still apply within that shape — e.g. a
process concept's "how it's used" section follows the steps pattern, a
comparison concept's follows the comparison pattern.

Imported by: modules/authoring/system.py
"""

TEXTBOOK_LESSON_STRUCTURE = """TEXTBOOK LESSON STRUCTURE (default shape — apply within `theory`)
Do not default to a flat "define, then explain" encyclopedia structure. Instead, build the
`theory` field around this arc:
1. The problem — what question or need does this concept address? Open here, not with a
   definition.
2. Why it matters — why should the learner care before you name the term?
3. How it works / how it's used — the mechanism, process, or definition itself, introduced
   only once the reader knows why it's worth learning.
4. Example — a concrete instance grounded in the source material (see `examples`).
5. Common mistake — a specific misunderstanding a learner is likely to have (only include if
   the source material genuinely supports one; do not invent a strawman mistake).
6. Quick recap — one or two sentences a learner could read alone to remember the shape of
   what they just learned.
This is a default, not a rigid template to force onto every concept — a very small supporting
concept may only need steps 1, 3, and 4. The point is: start from the problem the concept
solves, not from its dictionary definition."""

REFLECTION_QUESTION_GUIDE = """REFLECTION QUESTIONS
Where the lesson supports it, include one reflection question in `key_takeaways` framed as a
question rather than a statement (e.g. "Can you explain why X fails without Y?" rather than
"X requires Y"). This should test whether the learner could use the concept, not just recall
it. Do not force a reflection question onto purely factual/definitional content where it
would feel arbitrary."""

TEACHING_PATTERNS_GUIDE = """TEACHING PATTERNS
- Definition-first concepts: state the informal idea, then the precise \
definition, then one worked example.
- Process/algorithm concepts: describe the goal, then walk through the \
steps in order, then show the steps applied to one concrete case.
- Comparison concepts: state what's being compared, give the criteria for \
comparison explicitly, then compare point by point rather than describing \
each side fully in isolation.
- Story/case-study concepts: state the principle the story illustrates \
BEFORE or immediately AFTER the story, never leave the reader to infer it \
unaided.
- Common-misconception concepts: state the misconception, explain \
specifically why it's wrong, then state the correct understanding — do \
not just state the correct answer and hope the contrast is implicit."""
