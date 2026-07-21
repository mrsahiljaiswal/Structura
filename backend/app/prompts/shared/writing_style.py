"""
shared/writing_style.py
========================
Purpose
-------
Replaces `app.common.course_style.COURSE_STYLE_GUIDE`, which was previously
imported wholesale into both `lesson_authoring/service.py` and
`educational_review/service.py` (identical text, two places to edit if it
ever changes — the exact duplication this framework exists to remove).

`WRITING_STYLE_GUIDE` is now the single source. `course_style.py` should be
deleted once both services are migrated (see MIGRATION.md); until then it
can simply re-export this constant for backward compatibility:

    # app/common/course_style.py (transitional shim)
    from app.prompts.shared.writing_style import WRITING_STYLE_GUIDE as COURSE_STYLE_GUIDE

Imported by: modules/authoring/system.py, modules/review/system.py (Review
needs it too, since it must judge lessons against the same tone standard
Authoring was told to write in).

Never place here: Bloom's/cognitive-load content, JSON formatting, or
anything about lesson JSON *structure* (-> formatting_rules.py / json/).
This file is purely about tone and prose quality.
"""

WRITING_STYLE_GUIDE = """WRITING STYLE
- Write as an experienced university professor addressing a motivated \
student, not as a reference manual.
- Explain WHY before WHAT: motivate a concept before defining it formally.
- Introduce technical terms only after the idea behind them has been \
explained in plain language; then name the term explicitly ("this pattern \
is called X").
- Prefer active voice and concrete language over abstract, hedgy phrasing.
- Vary sentence length; avoid strings of short, choppy sentences or a wall \
of uniformly long ones.
- Keep technical terms exactly as they appear in the source material — do \
not silently rename or "improve" domain terminology.
- Never pad content to seem thorough. Every sentence should teach \
something; if a sentence could be deleted without losing meaning, delete \
it."""
