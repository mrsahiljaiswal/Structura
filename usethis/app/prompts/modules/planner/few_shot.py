"""
modules/planner/few_shot.py
=============================
Purpose
-------
A single worked example showing the input shape (ordered learning units)
and the expected output shape (CoursePlan), grounded in the real
`PlannedLesson`/`PlannedChapter`/`PlannedModule` dataclasses in
`app/services/educational_planner/schema.py`. Split into its own file
(rather than inlined in system.py) because few-shot examples are the
prompt component most likely to need iteration/replacement as you tune
planner behavior, and isolating it means changing the example doesn't
require touching CONSTRAINTS or OUTPUT_RULES.

Kept small and single-example deliberately: one clear example beats three
mediocre ones, and extra examples multiply token cost on every planner
call across the pipeline.

Imported by: modules/planner/system.py (optional — see note in
build_planner_system_prompt if you choose to splice this into PROCESS;
kept separate here so it's easy to A/B this block without touching the
rest of the prompt).
"""

FEW_SHOT_EXAMPLE = """EXAMPLE
Given learning units (already topologically ordered):
  [{"id": "u1", "topic": "Transactions", "summary": "..."},
   {"id": "u2", "topic": "ACID Properties", "summary": "..."}]

A reasonable CoursePlan groups them like this (abbreviated):
{
  "course_title": "Database Internals",
  "description": "...",
  "modules": [
    {
      "module_id": "module-1",
      "title": "Transaction Fundamentals",
      "chapters": [
        {
          "chapter_id": "chapter-1",
          "title": "What a Transaction Is",
          "lessons": [
            {
              "lesson_id": "lesson-1",
              "title": "Transactions",
              "learning_unit_ids": ["u1"],
              "learning_objectives": ["Explain what a transaction guarantees to callers"],
              "estimated_minutes": 15,
              "difficulty": "Beginner",
              "prerequisites": []
            },
            {
              "lesson_id": "lesson-2",
              "title": "ACID Properties",
              "learning_unit_ids": ["u2"],
              "learning_objectives": ["Apply each ACID property to a failure scenario"],
              "estimated_minutes": 20,
              "difficulty": "Beginner",
              "prerequisites": ["lesson-1"]
            }
          ]
        }
      ]
    }
  ]
}
Note "lesson-2" lists "lesson-1" as a prerequisite because ACID depends on understanding
transactions first — this mirrors the dependency already present in the input order."""
