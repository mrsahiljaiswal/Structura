"""
app/prompts/registry.py
=========================
Purpose
-------
One place that lists every AI module's prompt builder plus a version tag.
Two concrete uses this unlocks that scattered SYSTEM_PROMPT strings never
supported:

1. Prompt-eval harnesses can iterate `PROMPT_REGISTRY` and run each
   module's builder against fixture inputs without importing five
   different services.
2. `LLMClient` (or a logging wrapper around it) can log `prompt_version`
   alongside every call, so when lesson quality regresses you can
   correlate it with "we changed the authoring prompt from v3 to v4 on
   Tuesday" instead of guessing.

Bump a module's version string here any time its system.py content
changes in a way that could affect model behavior (i.e. almost any
change). Whitespace-only edits don't need a bump; wording, constraint, or
schema changes do.

What must never be placed here
-------------------------------
- Prompt content itself. This file only imports builder functions and
  assigns metadata.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

from app.prompts.modules.understanding.system import build_understanding_system_prompt
from app.prompts.modules.knowledge_extraction.system import build_knowledge_extraction_system_prompt
from app.prompts.modules.planner.system import build_planner_system_prompt
from app.prompts.modules.authoring.system import build_authoring_system_prompt
from app.prompts.modules.review.system import build_review_system_prompt


@dataclass(frozen=True)
class PromptEntry:
    module: str
    version: str
    builder: Callable[..., str]


PROMPT_REGISTRY: dict[str, PromptEntry] = {
    "understanding": PromptEntry("understanding", "v1.0.0", build_understanding_system_prompt),
    "knowledge_extraction": PromptEntry(
        "knowledge_extraction", "v1.0.0", build_knowledge_extraction_system_prompt
    ),
    "planner": PromptEntry("planner", "v1.0.0", build_planner_system_prompt),
    "authoring": PromptEntry("authoring", "v1.0.0", build_authoring_system_prompt),
    "review": PromptEntry("review", "v1.0.0", build_review_system_prompt),
}


def get_prompt_version(module: str) -> str:
    return PROMPT_REGISTRY[module].version
