"""
validation/self_check.py
==========================
Purpose: a final "check your own output before submitting" block appended
to every module's system prompt, right before OUTPUT_RULES resolves into
the actual schema. Cheap models skip self-verification unless explicitly
told to do it as a step, so this is deliberately generic and combined at
call time with each module's own CONSTRAINTS via `build_self_check()`.

Imported by: every modules/*/system.py.
"""

from __future__ import annotations

_BASE_SELF_CHECK = """SELF CHECK (perform silently before responding)
- Does every field in my response satisfy the schema's type exactly?
- Have I re-read my own output against the constraints above, not just \
against the input?
- Would this response survive a domain expert fact-checking it against \
the source material I was given?"""


def build_self_check(*extra_checks: str) -> str:
    """
    Compose the base self-check with module-specific checklist items.
    Example (Authoring):
        build_self_check(
            "Have I covered every learning objective I was given?",
            "Have I re-explained anything already covered by a prerequisite lesson?",
        )
    """
    if not extra_checks:
        return _BASE_SELF_CHECK
    extra_lines = "\n".join(f"- {c}" for c in extra_checks)
    return f"{_BASE_SELF_CHECK}\n{extra_lines}"
