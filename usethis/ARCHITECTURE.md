# Structura Prompt Framework — Architecture

## Why this exists

Today, prompt text is duplicated and drifting:

- `COURSE_STYLE_GUIDE` is imported wholesale into **both**
  `lesson_authoring/service.py` and `educational_review/service.py` — one
  string, two places to edit, already one file away from drifting.
- "No prose, no markdown fences" is retyped with different wording in
  Module 3, Module 5, Module 7 (`prompt_builder.py`), Module 8, and
  Module 9 — five independent places a future contributor could tighten
  inconsistently.
- Module 9's `issue.category` enum (`grammar|flow|hallucination|...`) is
  documented in the prompt text but never actually validated against the
  `ReviewIssue` dataclass — same class of silent drift the JSON schema
  renderer in `json/json_rules.py` is designed to prevent for new modules.
- `README.md` in every module already documents an implicit prompt
  section order (Purpose → Responsibilities → Must NOT do → Error
  Handling) — this framework makes that same discipline apply to the
  *prompt itself*, not just the module's documentation.

## Directory layout

```
app/prompts/
├── base/                     # leaf-level identity, no other prompt deps
│   ├── philosophy.py         # EDUCATIONAL_PHILOSOPHY (imported by all 5 AI modules)
│   ├── roles.py               # ROLE_* per module
│   └── prompt_sections.py    # PromptSection + assemble() — canonical section order
├── shared/                   # pedagogy & style, reused across 2+ modules
│   ├── cognitive_load.py     # planner, authoring
│   ├── blooms_taxonomy.py    # planner, authoring
│   ├── writing_style.py      # authoring, review  (replaces COURSE_STYLE_GUIDE)
│   ├── teaching_patterns.py  # authoring only
│   ├── lesson_completeness.py# authoring, review
│   ├── story_guidelines.py   # planner, authoring
│   └── formatting_rules.py   # authoring only (Markdown-inside-JSON rules)
├── json/
│   └── json_rules.py         # STRICT_JSON_OUTPUT_RULES + render_json_schema()
├── anti_hallucination/
│   └── grounding.py          # GENERATION variant + JUDGING variant
├── validation/
│   └── self_check.py         # build_self_check(*extra) appended to every module
├── critique/
│   └── critique_framework.py # CRITIQUE_RUBRIC + build_approval_policy() — review only today
├── repair/
│   └── repair_prompts.py     # build_repair_prompt() — used by LLMClient, not a module
├── modules/
│   ├── understanding/  {system.py, user.py}
│   ├── knowledge_extraction/  {system.py, user.py}
│   ├── planner/  {system.py, user.py*, few_shot.py}
│   ├── authoring/  {system.py, user.py}
│   └── review/  {system.py, user.py}
└── registry.py                # PROMPT_REGISTRY: module -> (version, builder)
```
`*` planner's user prompt is currently built inline in `service.py` from
structured JSON (`json.dumps(payload)`), not prose — there's no templating
to extract, so no `planner/user.py` ships in this pass. Add one if that
changes.

## Dependency graph (who imports whom)

```
philosophy.py ──┐
roles.py ───────┼──> modules/*/system.py  (every module, always)
prompt_sections.py ─┘

cognitive_load.py ──────┬──> planner/system.py, authoring/system.py
blooms_taxonomy.py ─────┘
story_guidelines.py ────┬──> planner/system.py, authoring/system.py
writing_style.py ───────┬──> authoring/system.py, review/system.py
lesson_completeness.py ─┘
teaching_patterns.py ───────> authoring/system.py  (only)
formatting_rules.py ────────> authoring/system.py  (only)

grounding.GENERATION ───┬──> knowledge_extraction/system.py, authoring/system.py
grounding.JUDGING ───────> review/system.py

json_rules.py ──────────> every modules/*/system.py
self_check.py ──────────> every modules/*/system.py
critique_framework.py ──> review/system.py  (only, today)
repair_prompts.py ──────> app.common.llm_client  (infra, NOT a module)

registry.py ────────────> imports every modules/*/system.py builder
```

Rule of thumb for where new content goes:
- Used by exactly one module → put it in `modules/<name>/system.py` directly.
- Used by two or more modules, and it's pedagogy/style → `shared/`.
- Used by two or more modules, and it's about the JSON envelope → `json/`.
- About "don't invent facts" → `anti_hallucination/`.
- About "did I follow the rules" self-verification → `validation/`.
- About judging/scoring already-produced content → `critique/`.
- About recovering from a malformed LLM response → `repair/` (infra layer).

## Prompt section order (enforced by `assemble()`)

`ROLE → MISSION → CONSTRAINTS → PROCESS → ANTI_HALLUCINATION → OUTPUT_RULES → SELF_CHECK`

Not every module uses every section — `assemble()` silently skips
empty/`None` sections. Understanding, for instance, has no `PROCESS`
section (a single classification pass needs no method) and no
`ANTI_HALLUCINATION` section is wired up for the Planner (it reorganizes
given metadata; it doesn't add new factual claims). This is intentional:
the framework enforces *order and headers*, not that every module must
pad itself out with irrelevant blocks.

## What each module composes (today)

| Module | philosophy | role | cognitive_load | blooms | writing_style | story | completeness | teaching_patterns | formatting | anti-hallucination | critique | json | self_check |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Understanding | ✅ | ✅ | | | | | | | | | | ✅ | ✅ |
| Knowledge Extraction | ✅ | ✅ | | | | | | | | GENERATION | | ✅ | ✅ |
| Planner | ✅ | ✅ | ✅ | ✅ | | ✅ | | | | | | ✅ | ✅ |
| Authoring | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | GENERATION | | ✅ | ✅ |
| Review | ✅ | ✅ | | | ✅ | | ✅ | | | JUDGING | ✅ | ✅ | ✅ |

## Extending this to a 30-module system

Adding module #6 (say, a future Quiz Generation module) means:
1. Add one `ROLE_QUIZ_GENERATION` line to `base/roles.py`.
2. Create `modules/quiz_generation/system.py` importing whichever
   `shared/`, `json/`, `anti_hallucination/`, `critique/` blocks actually
   apply — most will already exist.
3. Register it in `registry.py` with a version string.
4. Zero edits required to any existing module's prompt.

That's the test for whether this framework is working: a new module
should almost never require editing an old module's file.
