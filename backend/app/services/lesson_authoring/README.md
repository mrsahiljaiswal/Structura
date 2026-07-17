# Module 8 — Lesson Authoring Engine

## Purpose
The second major AI module. Given one lesson's plan and its source learning
units, generate the actual teaching content.

## Input
One `PlannedLesson` (from Module 7's `CoursePlan`) + the related
`LearningUnit`s + prerequisite lesson titles (for context/tone only).

## Output
`lesson.<lesson_id>.json` — a `Lesson` with overview, theory, definitions,
examples, analogies, misconceptions, applications, summary, and key
takeaways.

## Responsibilities
- Author every lesson independently - this module never sees the whole
  course, only the one lesson's plan and source material, which keeps it
  parallelizable and easy to re-run for a single lesson without touching
  the rest of the course.
- Ground all content in the provided learning-unit text; the prompt
  explicitly forbids inventing facts not supported by the source.

## Must NOT do
- Persist directly to the database (Module 9 must review first).
- Reference lessons outside the ones explicitly passed as prerequisites.

## Pipeline Position
Previous: Module 7 (Educational Planning). Next: Module 9 (Educational
Review). Generated lessons must NEVER go directly into the DB - review is
mandatory.

## Error Handling
- A planned lesson referencing learning unit ids that don't exist in the
  `LearningUnitSet` -> `LessonAuthoringError`.
- LLM failure or missing `overview`/`theory` in the response ->
  `LessonAuthoringError`.
- Validator additionally rejects an empty overview, a suspiciously short
  theory section, or zero key takeaways as signs of a degenerate response.

## Testing
`tests/test_service.py` authors a single lesson via a fake LLM responder
and verifies the parsed `Lesson` matches the injected content, plus
`author_all` wiring lesson prerequisites by id.
