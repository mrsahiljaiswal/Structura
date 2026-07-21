"""
base/prompt_sections.py
========================
Purpose
-------
Enforces one consistent SYSTEM PROMPT shape across every module, so a
reviewer scanning `modules/planner/system.py` and `modules/authoring/system.py`
sees the same section order and can trust it's actually followed. This is
the "prompt architecture" scaffold requested for the framework.

Section order (fixed for every AI module in the pipeline):
    ROLE            - who you are (philosophy + role)
    MISSION         - the one-sentence job for this call
    CONSTRAINTS     - hard must/must-not rules specific to this module
    PROCESS         - optional: step-by-step method, only when order matters
    ANTI_HALLUCINATION  - grounding rules (omitted for modules with no source
                           text to hallucinate away from, e.g. pure planning)
    OUTPUT_RULES    - JSON shape + formatting rules
    SELF_CHECK      - the model's own pre-submission checklist

Not every module uses every section (e.g. Understanding has no PROCESS
section because it's a single classification pass, not a multi-step
method) — `assemble()` simply skips any section passed as None/empty, so
each module's system.py stays declarative: it picks which blocks apply and
in what content, and this file guarantees the ORDER and headers are never
inconsistent between modules.

Responsibilities
----------------
- `PromptSection` dataclass + `assemble()` function only.
- No actual prompt text lives here. This is structure, not content.

What must never be placed here
-------------------------------
- Any prompt content (role text, JSON schemas, etc). If you're tempted to
  hardcode a string here, it belongs in base/, shared/, json/, or a
  modules/<name>/ file instead.

Dependency graph
-----------------
prompt_sections.py -> nothing (leaf node, pure structure)
prompt_sections.py <- every modules/*/system.py
"""

from __future__ import annotations

from dataclasses import dataclass

_SECTION_ORDER = [
    "ROLE",
    "MISSION",
    "CONSTRAINTS",
    "PROCESS",
    "ANTI_HALLUCINATION",
    "OUTPUT_RULES",
    "SELF_CHECK",
]


@dataclass
class PromptSection:
    name: str
    body: str | None

    def __post_init__(self) -> None:
        if self.name not in _SECTION_ORDER:
            raise ValueError(
                f"Unknown prompt section '{self.name}'. Valid sections: {_SECTION_ORDER}. "
                "If a module genuinely needs a new section type, add it to _SECTION_ORDER "
                "here first so every other module's ordering stays predictable."
            )


def assemble(*sections: PromptSection) -> str:
    """
    Render sections in the fixed canonical order, skipping any section that
    is missing or empty. Sections passed out of order are re-sorted, so a
    module.py author can list them in whatever order is convenient and
    still get a consistent final prompt.
    """
    # Multiple PromptSection entries with the same name are concatenated in
    # the order given, rather than the last one silently overwriting the
    # rest — a module composing e.g. two PROCESS blocks (cognitive load +
    # Bloom's) should not lose one because of dict-key collision.
    by_name: dict[str, list[str]] = {}
    for s in sections:
        if s.body and s.body.strip():
            by_name.setdefault(s.name, []).append(s.body.strip())

    blocks = []
    for name in _SECTION_ORDER:
        if name in by_name:
            joined = "\n\n".join(by_name[name])
            blocks.append(f"## {name.replace('_', ' ')}\n{joined}")
    return "\n\n".join(blocks)
