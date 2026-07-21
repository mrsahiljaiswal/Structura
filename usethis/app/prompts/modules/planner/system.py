"""
modules/planner/system.py
===========================
Purpose
-------
Replaces `app/services/educational_planner/prompt_builder.py` AND the
`.prompts` module it imports from (`SYSTEM_PROMPT`, `SCHEMA_PROMPT`,
`VALIDATION_PROMPT`, `FEW_SHOT_PROMPT`). Those four constants are folded
into the canonical section structure here instead of being concatenated
ad hoc by `build_system_prompt()`.

Composition: philosophy + role + cognitive-load (lesson sizing) +
Bloom's (writing objectives) + story guidelines (when a story earns its
own lesson) + JSON rules + validation. Notably NOT anti-hallucination —
the planner only reorganizes learning-unit metadata it's handed
(topic/summary/keywords), it doesn't introduce new factual claims, so a
grounding rule here would be inert.

The original `CURRICULUM_GUIDELINES` free-text block from
`prompt_builder.py` is preserved below as CONSTRAINTS, since it encodes
real product decisions (one lesson per major concept/story/comparison/
framework, merge only on true duplication) that aren't generic enough to
belong in shared/ — they're specific to how Structura wants its curricula
shaped, not a general pedagogical principle another module would reuse.

What services import this: educational_planner/service.py, replacing its
`from .prompt_builder import build_system_prompt` import 1:1.
"""

from app.prompts.base.philosophy import EDUCATIONAL_PHILOSOPHY
from app.prompts.base.roles import ROLE_PLANNER
from app.prompts.base.prompt_sections import PromptSection, assemble
from app.prompts.shared.cognitive_load import COGNITIVE_LOAD_GUIDE
from app.prompts.shared.blooms_taxonomy import BLOOMS_GUIDE
from app.prompts.shared.story_guidelines import STORY_AND_EXAMPLE_GUIDELINES
from app.prompts.json.json_rules import STRICT_JSON_OUTPUT_RULES, render_json_schema
from app.prompts.validation.self_check import build_self_check
from app.prompts.modules.planner.few_shot import FEW_SHOT_EXAMPLE

VALID_DIFFICULTIES = ("Beginner", "Intermediate", "Advanced")

_CURRICULUM_CONSTRAINTS = """CURRICULUM DESIGN RULES (Structura-specific — not generic pedagogy)
- Create one lesson for every major concept, major story that teaches an important \
principle, major comparison, and major framework or process.
- Merge lessons ONLY if they teach exactly the same concept. Do not merge merely because \
concepts are related.
- Preserve important examples, case studies, and stories rather than folding them into a \
broader lesson.
- Each lesson teaches ONE central idea. Large topics must be divided into smaller teachable \
lessons rather than one broad lesson.
- Avoid broad philosophical lessons that combine many unrelated ideas — the learner should \
feel every lesson teaches exactly one thing.
- Preserve the prerequisite order you were given in the learning units list. You may group \
units into modules/chapters/lessons, but never place a unit before a prerequisite it depends \
on."""

_SCHEMA = {
    "course_title": "string",
    "description": "string",
    "modules": [
        {
            "module_id": "string",
            "title": "string",
            "chapters": [
                {
                    "chapter_id": "string",
                    "title": "string",
                    "lessons": [
                        {
                            "lesson_id": "string",
                            "title": "string",
                            "learning_unit_ids": ["ids from the provided learning units list"],
                            "learning_objectives": ["Bloom's-calibrated objective strings"],
                            "estimated_minutes": "positive integer",
                            "difficulty": f"one of {list(VALID_DIFFICULTIES)}",
                            "prerequisites": ["other lesson_ids in this same plan"],
                        }
                    ],
                }
            ],
        }
    ],
}


def build_planner_system_prompt(*, include_example: bool = True) -> str:
    return assemble(
        PromptSection("ROLE", f"{EDUCATIONAL_PHILOSOPHY}\n\n{ROLE_PLANNER}"),
        PromptSection(
            "MISSION",
            "Group the given ordered learning units into modules, chapters, and lessons, "
            "each with learning objectives, a time estimate, a difficulty, and prerequisite "
            "lesson_ids, the way a professor would build a syllabus.",
        ),
        PromptSection("CONSTRAINTS", f"{_CURRICULUM_CONSTRAINTS}\n\n{STORY_AND_EXAMPLE_GUIDELINES}"),
        PromptSection(
            "PROCESS",
            f"{COGNITIVE_LOAD_GUIDE}\n\n{BLOOMS_GUIDE}"
            + (f"\n\n{FEW_SHOT_EXAMPLE}" if include_example else ""),
        ),
        PromptSection(
            "OUTPUT_RULES",
            f"{STRICT_JSON_OUTPUT_RULES}\n\n{render_json_schema(_SCHEMA, title='CoursePlan')}",
        ),
        PromptSection(
            "SELF_CHECK",
            build_self_check(
                "Does every lesson_id referenced as a prerequisite actually exist elsewhere "
                "in this plan?",
                "Did I preserve the given learning-unit order, or did I accidentally place a "
                "unit ahead of something it depends on?",
            ),
        ),
    )
