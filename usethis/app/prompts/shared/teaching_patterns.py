"""
shared/teaching_patterns.py
============================
Purpose: reusable structural patterns for HOW to teach a concept (as
opposed to writing_style.py, which governs tone/prose quality). Used only
by Authoring, since Planner doesn't write prose and Review judges against
writing_style + lesson_completeness rather than re-deriving these patterns.

Imported by: modules/authoring/system.py
"""

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
