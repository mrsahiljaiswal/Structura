# Module 7 — Educational Planning Engine

## Purpose
This module does NOT generate lessons. It creates the curriculum: Course ->
Modules -> Chapters -> Lessons -> Learning Objectives -> Estimated Time ->
Difficulty -> Prerequisites. Think like a professor building a syllabus.

## Input
`KnowledgeGraph` (Module 5) + `LearningUnitSet` (Module 6) + a course title.

## Output
`course_plan.json` — a `CoursePlan` (see `schema.py` for the full nested
shape: modules -> chapters -> lessons).

## Responsibilities
- Compute a deterministic learning order via topological sort over the
  knowledge graph's `requires` edges (Kahn's algorithm) - this part uses
  NO AI, so prerequisite ordering is guaranteed correct even if the LLM's
  grouping choices vary.
- Ask the LLM to group the ordered learning units into modules, chapters,
  and lessons with objectives and time estimates, explicitly instructed to
  preserve the given order.

## Must NOT do
- Author lesson content (Module 8).
- Reorder concepts ahead of their prerequisites - that's a validator-level
  concern.

## Pipeline Position
Previous: Module 6 (Semantic Segmentation). Next: Module 8 (Lesson
Authoring).

## Error Handling
- Zero learning units -> `PlanningError`.
- Cyclic prerequisite graph -> best-effort fallback (remaining concepts
  appended in id order) rather than a hard failure, since a professor
  would still need to produce *some* plan.
- Malformed LLM output (missing required keys) -> `PlanningError`.
- Empty modules/chapters/lessons, lessons with no learning units, or a
  lesson prerequisite pointing to an unknown lesson_id -> validator raises
  `PlanningError`.

## Testing
`tests/test_service.py` feeds a small knowledge graph with a `requires`
edge and asserts the topological order puts the prerequisite first, and
that a fake LLM response is faithfully parsed into a `CoursePlan`.
