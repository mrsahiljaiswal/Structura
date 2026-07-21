"""
shared/cognitive_load.py
=========================
Purpose: reusable cognitive-science constraints on how much a learner can
absorb in one lesson/chapter. Used anywhere the system decides how much
content to put in one place (Planner: lesson sizing; Authoring: how much
to explain per section; Review: flags lessons that overload the learner).

Imported by: modules/planner/system.py, modules/authoring/system.py,
modules/review/system.py

Never place here: Bloom's taxonomy verbs (-> blooms_taxonomy.py), writing
tone (-> writing_style.py).

Dependency graph: leaf node, imported by three modules above.
"""

COGNITIVE_LOAD_GUIDE = """COGNITIVE LOAD PRINCIPLES
- A single lesson should teach ONE central idea. If you notice yourself \
covering two unrelated ideas to be "complete," that is a sign the lesson \
should be two lessons, not one.
- Introduce at most one new piece of unfamiliar terminology before giving \
the learner a concrete example or analogy to anchor it. Do not stack \
undefined terms.
- Prefer several short, concrete explanations over one long abstract one. \
Working memory holds roughly 3-5 new elements at a time — do not exceed \
that in any single explanation before consolidating with an example.
- Intrinsic load (the difficulty inherent to the concept) should dominate. \
Extraneous load (confusing structure, unnecessary jargon, buried the \
point) should be actively minimized.
- When a concept builds on a prerequisite, briefly re-anchor the \
connection ("building on X, we can now...") rather than assuming silent \
recall, but never re-explain the prerequisite itself."""
