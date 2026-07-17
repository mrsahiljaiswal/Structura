# Module 9 — Educational Review Engine

## Purpose
Generated lessons should NEVER go directly into the database. This module
is the mandatory quality gate.

## Input
`Lesson` (Module 8) + its source `LearningUnit`s (for hallucination
checking).

## Output
`reviewed_lesson.<lesson_id>.json` — a `ReviewedLesson` wrapping the
original lesson with a quality score (0-100), a list of issues, and an
`approved` flag.

## Responsibilities
Checks: grammar, educational flow, hallucinations (claims unsupported by
source text), missing concepts, redundancy, difficulty consistency, and
terminology consistency.

## Must NOT do
- Rewrite the lesson itself - only Module 8 authors content. If a lesson
  fails review, the pipeline should re-run Module 8 for that lesson, not
  patch it here.

## Pipeline Position
Previous: Module 8 (Lesson Authoring). Next: Module 10 (Course Assembly) -
but ONLY for lessons where `approved == True`.

## Approval Policy
A lesson is approved only if `quality_score >= 70` AND there are no `high`
severity issues. This floor is enforced in code (`_to_reviewed_lesson`)
even if the model's own `approved` flag disagrees, so a prompt-level
mistake can't silently downgrade the quality bar.

## Error Handling
- LLM failure or an out-of-range `quality_score` -> `ReviewError`.
- Validator raises `ReviewError` for any lesson that isn't approved, so
  callers can catch it and trigger re-authoring.

## Testing
`tests/test_service.py` reviews a lesson with a fake "approve" response
and a fake "reject due to high-severity hallucination" response, and
asserts the approval-floor logic overrides a model that claims approval
despite a high-severity issue.
