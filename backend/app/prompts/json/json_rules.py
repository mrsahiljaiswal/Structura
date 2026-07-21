"""
json/json_rules.py
===================
Purpose
-------
The single canonical statement of "how to emit JSON" — no code fences, no
prose preamble, strict typing. Every module's SYSTEM_PROMPT currently
retypes a version of this (compare Module 3's "no prose, no markdown
fences" vs Module 8's "Return ONLY valid JSON... Do NOT wrap the response
in Markdown or code fences" — same rule, drifted wording). This file ends
that drift.

Also provides `render_json_schema()`, a small helper so a module's
OUTPUT_RULES section can embed its *actual* Pydantic/dataclass schema
instead of a hand-maintained JSON example that silently goes stale when
the dataclass changes (see schema.py files in every module — several of
these have drifted from their hand-written prompt examples already, e.g.
Module 9's issue `category` enum values are not enforced anywhere in the
prompt text).

Imported by: every modules/*/system.py that expects a JSON response.
(Every current AI module does — Understanding, Knowledge Extraction,
Planner, Authoring, Review.)

What must never be placed here
-------------------------------
- Any module's specific schema shape (that's passed IN via
  render_json_schema, not hardcoded here).
"""

from __future__ import annotations

STRICT_JSON_OUTPUT_RULES = """OUTPUT FORMAT
- Respond with ONLY a single JSON object. No prose before or after it, no \
markdown code fences, no commentary.
- Every field in the schema below must be present. Use `null` for an \
optional field with no value, and `[]`/`""` for an empty array/string field \
— never omit a field entirely.
- Field types must match the schema exactly: if a field is typed as an \
array of strings, every element must be a plain string, never a nested \
object.
- Do not invent additional fields beyond the schema."""


def render_json_schema(schema: dict, *, title: str | None = None) -> str:
    """
    Render a plain-dict JSON schema example into prompt text, so module
    system.py files pass in one dict literal that mirrors their actual
    dataclass/Pydantic model instead of hand-typing an example that can
    drift from the real schema silently.

    `schema` is a plain dict using Python literals as a JSON-shape example
    (e.g. {"quality_score": "integer 0-100", "issues": [{...}]}) — this is
    intentionally NOT introspected from the dataclass automatically, since
    prompts need human-readable type hints ("integer 0-100") rather than
    Python type names, but it keeps the example colocated with the module
    prompt file where a reviewer can diff it against schema.py by hand.
    """
    import json as _json

    body = _json.dumps(schema, indent=2)
    header = f"Respond with a JSON object matching exactly this shape" + (
        f" ({title}):" if title else ":"
    )
    return f"{header}\n{body}"
