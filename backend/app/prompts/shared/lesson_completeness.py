"""
shared/lesson_completeness.py
==============================
Purpose: the shared definition of "a lesson is complete" — used by
Authoring as a target to write toward, and by Review as a checklist to
grade against. This is the single place that defines what fields/content
a finished lesson must contain, so Authoring and Review can't drift apart
(e.g. Review inventing a completeness bar Authoring was never told about).

Imported by: modules/authoring/system.py, modules/review/system.py
"""

LESSON_COMPLETENESS_CHECKLIST = """LESSON COMPLETENESS CHECKLIST
A complete lesson:
- Covers every stated learning objective — no objective is left implicit.
- Defines every technical term it introduces (in `definitions`).
- Contains at least one concrete example per non-trivial concept \
(in `examples`), grounded in the source material.
- Analogies are OPTIONAL (in `analogies`): Include an analogy ONLY when a concept \
is abstract, unintuitive, or materially benefits from comparison. Do NOT mark a lesson \
incomplete or reject it for lacking an analogy if the material is straightforward or simple.
- Names any misconception a learner is likely to have about this material, \
if the source material supports one (in `misconceptions`); an empty list \
is acceptable when nothing warrants it.
- States at least one real-world application (in `applications`).
- Ends with a `summary` that a learner could read alone to recall the \
lesson's shape, and `key_takeaways` that are independently useful without \
the rest of the lesson."""
