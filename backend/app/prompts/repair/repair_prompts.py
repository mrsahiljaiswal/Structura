"""
repair/repair_prompts.py
==========================
Purpose
-------
Two distinct repair mechanisms live here:

1. `build_repair_prompt()` (unchanged from v1) — infrastructure-level JSON
   parse-failure retry, used by `LLMClient.complete_json()`. Has nothing
   to do with lesson quality.

2. `build_authoring_repair_prompt()` (new — implements Priority 7) — a
   DOMAIN-level repair: when Educational Review rejects a lesson, this
   turns the reviewer's own issue list into a targeted re-authoring prompt
   instead of just calling `LessonAuthoringService.author()` again from
   scratch with no memory of what was wrong. Re-running from scratch
   wastes the specific, often-correct diagnostic work Review already did,
   and risks reproducing the exact same mistake if the model's first
   instinct on this source material was already off.

This is deliberately still a FULL re-author (the pipeline's README is
explicit: "Generated lessons must never go directly into the DB" and
"Module 9 must NOT rewrite the lesson itself... if it fails, re-run
Module 8"). What changes is that Module 8's prompt now includes the prior
attempt's issues, not that Module 9 patches the lesson directly — that
line stays firm.

Imported by: a new orchestration layer (see INTEGRATION_GUIDE.md step 4,
`app/services/pipeline/repair_loop.py`) that sits above both
LessonAuthoringService and EducationalReviewService — NOT by either
service directly, since neither should need to know the other exists.
"""

from __future__ import annotations


def build_repair_prompt(*, malformed_response: str, parse_error: str) -> str:
    """Infrastructure-level: fix a response that failed JSON parsing."""
    return (
        "Your previous response could not be parsed as JSON. "
        f"Parser error: {parse_error}\n\n"
        "Your previous response was:\n"
        f"{malformed_response}\n\n"
        "Return ONLY a corrected JSON object satisfying the original schema. "
        "No prose, no markdown code fences, no explanation of what you fixed."
    )


def build_authoring_repair_prompt(*, original_user_prompt: str, issues: list[dict],
                                    dimension_scores: dict[str, int] | None = None,
                                    max_attempts_note: int | None = None) -> str:
    """
    Build the USER prompt for a re-authoring attempt after Review rejects a
    lesson. Appends the reviewer's specific findings to the ORIGINAL
    authoring user prompt (same lesson title/objectives/source material —
    do not regenerate that, only add the correction context) so the model
    fixes what was actually wrong rather than re-rolling blind.

    `issues` is the raw list of dicts from ReviewedLesson.issues
    (category/severity/dimension/description). `dimension_scores`, if
    provided, lets the model see which dimensions were weakest even for
    issues too diffuse to state as a single bullet (e.g. "pedagogy: 55" is
    useful context beyond individual issue strings).
    """
    high = [i for i in issues if i.get("severity") == "high"]
    other = [i for i in issues if i.get("severity") != "high"]

    def _fmt(i: dict) -> str:
        dim = f" [{i['dimension']}]" if i.get("dimension") else ""
        return f"- ({i.get('severity', 'unknown')}){dim} {i.get('description', '')}"

    issue_lines = "\n".join(_fmt(i) for i in high + other) or "- (none listed)"

    dims_block = ""
    if dimension_scores:
        weakest = sorted(dimension_scores.items(), key=lambda kv: kv[1])[:3]
        dims_block = (
            "\n\nWEAKEST SCORED DIMENSIONS LAST ATTEMPT:\n"
            + "\n".join(f"- {name}: {score}/100" for name, score in weakest)
        )

    attempts_note = (
        f"\n\nThis is repair attempt within a bounded retry budget "
        f"(max {max_attempts_note} attempts) — if you cannot fully resolve every high-severity "
        f"issue with the given source material, prioritize the high-severity ones completely "
        f"over partially addressing every issue."
        if max_attempts_note else ""
    )

    return (
        f"{original_user_prompt}\n\n"
        f"--- REVISION REQUIRED ---\n"
        f"Your previous version of this lesson was reviewed and rejected. Address every issue "
        f"below, especially high-severity ones, without regressing on anything the reviewer "
        f"did NOT flag as a problem. Do not simply reshuffle wording — fix the substance the "
        f"issue names.\n\n"
        f"{issue_lines}"
        f"{dims_block}"
        f"{attempts_note}"
    )
