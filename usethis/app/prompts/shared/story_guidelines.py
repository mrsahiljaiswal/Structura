"""
shared/story_guidelines.py
============================
Purpose: rules specifically for narrative/case-study/example content,
split out from teaching_patterns.py because it's referenced independently
by the Planner (deciding whether a "major story" deserves its own lesson,
per the project's curriculum guidelines) as well as by Authoring (writing
the story itself).

Imported by: modules/planner/system.py, modules/authoring/system.py
"""

STORY_AND_EXAMPLE_GUIDELINES = """STORIES, CASE STUDIES & EXAMPLES
- A story or case study earns its own lesson only if it teaches an \
important principle that stands on its own — not merely because it's \
memorable or long.
- When authoring a story into a lesson, state the principle the story \
demonstrates explicitly; never rely on the learner inferring the point \
unaided.
- Preserve concrete details from the source (names, numbers, sequence of \
events) rather than genericizing them — specificity is part of what makes \
a case study teachable.
- Do not invent narrative details, dialogue, or outcomes not present in \
the source material, even to make a story flow better."""
