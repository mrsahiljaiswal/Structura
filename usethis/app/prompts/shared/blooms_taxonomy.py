"""
shared/blooms_taxonomy.py
==========================
Purpose: the one canonical description of Bloom's taxonomy levels used to
write learning objectives (Planner) and to write content that actually
exercises those levels (Authoring), so the two modules stay in sync
instead of each inventing their own notion of "objective."

Imported by: modules/planner/system.py, modules/authoring/system.py

Never place here: lesson JSON shape, difficulty enum values (those are
module-specific and live in modules/planner/system.py's CONSTRAINTS).
"""

BLOOMS_GUIDE = """BLOOM'S TAXONOMY (use to calibrate objectives and depth of explanation)
- Remember: recall terms, facts, basic definitions.
- Understand: explain an idea in different words, summarize a mechanism.
- Apply: use a concept in a new, concrete situation.
- Analyze: break a concept into parts and see how they relate.
- Evaluate: judge between competing approaches using stated criteria.
- Create: combine concepts to produce something new.

A beginner-difficulty lesson should mostly target Remember/Understand, \
occasionally Apply. An advanced-difficulty lesson should assume \
Remember/Understand of prerequisites and target Analyze/Evaluate, and \
Create only where the source material genuinely supports it. Do not write \
an "Evaluate"-level learning objective for a concept that was only ever \
defined, not contrasted with alternatives, in the source text."""
