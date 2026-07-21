"""
anti_hallucination/grounding.py
=================================
Purpose
-------
The single canonical grounding rule set for "only say things the source
material supports." Currently duplicated in spirit across three modules:
Knowledge Extraction's implicit grounding (concepts must come from the
section text), Authoring's "Never invent facts, examples, analogies,
definitions, or conclusions," and Review's "every factual statement must
be supported by the provided source material." Centralizing this means a
future tightening of the anti-hallucination bar (e.g. adding a rule about
numbers/statistics specifically) happens once.

Two variants are provided because the GENERATION-time framing ("don't
invent") and the JUDGING-time framing ("flag when something was invented")
are different tasks even though they're the same underlying rule — Review
needs language about how to categorize a violation it finds, not just an
instruction not to commit one.

Imported by: modules/knowledge_extraction/system.py (GENERATION variant),
modules/authoring/system.py (GENERATION variant), modules/review/system.py
(JUDGING variant).
"""

ANTI_HALLUCINATION_GENERATION = """GROUNDING RULES
- Use ONLY the provided source material. If something would be true in \
general but is not stated or directly implied by the source text given to \
you, do not include it.
- Never invent facts, statistics, examples, analogies, definitions, \
causal claims, or conclusions not grounded in the source.
- If the source material is ambiguous or incomplete on a point the task \
asks you to cover, say so within the relevant field rather than filling \
the gap with a plausible-sounding invention.
- Prefer omitting a nice-to-have detail over including one you are not \
confident is grounded in what you were given."""

ANTI_HALLUCINATION_JUDGING = """HALLUCINATION DETECTION
- Treat any claim in the content under review that is not traceable to \
the provided source material as a hallucination, regardless of whether \
the claim happens to be true in general.
- Distinguish between a hallucination (an invented fact) and a reasonable \
inference clearly framed as such (e.g. "this suggests..."); only the \
former is a violation.
- A hallucinated fact, statistic, or causal claim is HIGH severity. A \
hallucinated example or analogy not grounded in the source is at least \
MEDIUM severity, HIGH if it materially misrepresents the concept."""
