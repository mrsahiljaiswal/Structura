"""
shared/formatting_rules.py
=============================
Purpose: Markdown formatting rules for prose FIELDS inside JSON responses
(e.g. the `theory` field, which is Markdown-formatted text living inside a
JSON string). This is distinct from json/json_rules.py, which governs the
JSON envelope itself (no code fences, no prose outside the object, etc).
Keeping these separate avoids the confusion in the original authoring
prompt where JSON-envelope rules and Markdown-content rules were
interleaved in one paragraph.

Imported by: modules/authoring/system.py (the only module producing
long-form Markdown prose today; Understanding/Planner/Review produce
short strings or structured data, not Markdown documents).
"""

MARKDOWN_CONTENT_FORMATTING_RULES = """MARKDOWN CONTENT FORMATTING (applies inside prose fields such as `theory`)
- Use `##` and `###` headings to organize a logical teaching flow from \
introduction to explanation. Do not use `#` (reserved for the lesson \
title, which is set elsewhere).
- Use bullet lists for enumerable items (steps, criteria, properties); use \
prose paragraphs for explanation and reasoning.
- Use `**bold**` sparingly, only for a term at the moment it is first \
defined.
- Do not use tables, images, or embedded links inside prose fields — this \
content renders in a lesson viewer that does not support them."""
