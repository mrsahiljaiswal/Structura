"""
repair/repair_prompts.py
==========================
Purpose
-------
Every module's README currently documents "LLMClient retries once
internally" on a bad JSON response (see Module 3's README), but that retry
today just re-sends the same prompt and hopes for a different roll — it
doesn't tell the model what was wrong. This file gives `LLMClient` a
single, generic repair-prompt builder so the retry actually improves the
odds of success, without every module needing its own repair logic.

This lives outside `modules/` deliberately: repair is a property of the
LLM-calling infrastructure (`app.common.llm_client.LLMClient`), not of any
one module's domain content. `LLMClient.complete_json()` should call
`build_repair_prompt()` internally when its first parse attempt fails.

Imported by: app.common.llm_client (infrastructure, not a module prompt)

What must never be placed here
-------------------------------
- Module-specific schema knowledge. The repair prompt receives the
  original system/user prompt and the malformed response as opaque
  strings; it does not know or care which module produced them.
"""


def build_repair_prompt(*, malformed_response: str, parse_error: str) -> str:
    """
    Build a follow-up user message asking the model to fix its own
    previous output, given to LLMClient as the second turn in a two-turn
    retry when the first response fails JSON parsing.
    """
    return (
        "Your previous response could not be parsed as JSON. "
        f"Parser error: {parse_error}\n\n"
        "Your previous response was:\n"
        f"{malformed_response}\n\n"
        "Return ONLY a corrected JSON object satisfying the original schema. "
        "No prose, no markdown code fences, no explanation of what you fixed."
    )
