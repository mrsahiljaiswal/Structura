# Module 10 — Course Assembly Engine

## Purpose
Collect the approved lessons, compute reading time and word count, aggregate
into the final course structure, and persist to JSON (or PostgreSQL).

## Input
`CoursePlan` (Module 7) + approved `ReviewedLesson`s (Module 9).

## Output
`final_course.json` — a `FinalCourse`:
```json
{
  "course_title": "Database Internals",
  "description": "...",
  "modules": [...],
  "statistics": {
    "total_lessons": 12,
    "total_word_count": 24000,
    "total_reading_time_minutes": 120,
    "average_quality_score": 82.5
  },
  "dependencies": {
    "l1": [],
    "l2": ["l1"],
    ...
  }
}
```

## Responsibilities
- Verify all planned lessons have passed review (are in the approved set).
- Estimate word count per lesson from content field lengths.
- Estimate reading time from word count (default 200 words/minute).
- Compute course-wide statistics: total lessons, word count, reading time,
  average quality score from the reviewed lessons.
- Build a lesson-level dependency graph from the course plan's prerequisite
  links.

## Must NOT do
- Re-author or modify lessons.
- Re-run review on lessons that failed it (that's a developer's manual choice).

## Pipeline Position
Previous: Module 9 (Educational Review). Final stage - lesson content goes
here and ONLY here.

## Error Handling
- No approved lessons provided -> `AssemblyError`.
- Planned lesson not in the approved set -> `AssemblyError` (catches
  inconsistencies between the plan and the approved lessons).
- Zero modules, lessons, or word count in the final course -> validator
  raises `AssemblyError`.
- Dependency graph with an edge pointing to an unknown lesson -> validator
  raises `AssemblyError`.

## PostgreSQL Persistence
The `PostgreSQLExporter` is a placeholder sketch. A real implementation would:
1. Map Course, Module, Chapter, Lesson to ORM models (SQLAlchemy, etc).
2. Insert the course and all nested entities.
3. Return the course ID or similar for downstream tracking.

## Testing
`tests/test_service.py` assembles a simple plan + reviewed lessons,
computes word counts and reading times, and checks the dependency graph.
