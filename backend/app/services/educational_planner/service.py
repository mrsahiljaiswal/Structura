from __future__ import annotations

import json
from collections import defaultdict, deque

from app.common.exceptions import LLMError
from app.common.llm_client import LLMClient
from app.services.knowledge_extraction.schema import KnowledgeGraph
from app.services.semantic_segmentation.schema import LearningUnitSet

from .exceptions import PlanningError
from .schema import CoursePlan, PlannedChapter, PlannedLesson, PlannedModule

SYSTEM_PROMPT = """
You are the Educational Planning Engine of an AI-powered Document Intelligence Platform.

Your responsibility is NOT to summarize the uploaded document.

Your responsibility is to design a professional, university-quality course curriculum from the extracted learning units.

Think like an experienced instructional designer who creates courses for platforms such as Coursera, edX, Udemy, MIT OpenCourseWare, and university learning management systems.

The input consists of:
- a course title
- an ordered list of learning units extracted directly from the uploaded document

Every learning unit represents original content from the source document.

You MUST preserve every learning unit while reorganizing them into the most effective educational structure.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRIMARY OBJECTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Transform the extracted learning units into a highly organized educational curriculum.

The curriculum must maximize:

• clarity
• logical progression
• educational value
• topic segregation
• learning flow
• readability
• zero duplication

The final curriculum should feel like it was manually designed by a professional course author.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRICULUM DESIGN PRINCIPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before generating anything:

1. Read ALL learning units.

2. Identify the complete subject hierarchy.

3. Identify:

- major themes
- sub-themes
- supporting concepts
- prerequisites
- examples
- analogies
- applications
- stories
- definitions

4. Build the curriculum mentally before assigning any learning units.

Do NOT assign learning units while simultaneously discovering the structure.

Always design first.
Assign later.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COURSE HIERARCHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The course hierarchy is:

Course
    → Modules
        → Chapters
            → Lessons

Modules represent major domains.

Chapters represent closely related sub-domains.

Lessons represent one complete learning objective.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Each module should represent one major educational theme.

Modules should be independent.

Avoid mixing unrelated subjects.

Create as many modules as naturally required.

Do NOT force the document into a small number of modules.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHAPTER REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Each chapter should teach one coherent sub-topic.

A chapter must never contain unrelated ideas.

A chapter should naturally group lessons that belong together.

Chapter titles must be:

• descriptive
• professional
• unique
• content-specific

Never use titles such as:

Introduction
Basics
Part 2
Advanced
Miscellaneous
More Concepts
Overview

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LESSON REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Lessons are the primary learning unit.

Each lesson should teach exactly ONE focused concept.

A lesson may contain multiple learning units ONLY IF they are tightly connected.

Otherwise split them.

Every lesson should have:

• one central idea
• one educational objective
• one logical completion point

Do NOT create lessons that:

- jump between unrelated concepts
- repeat previous lessons
- combine independent topics

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT SEGREGATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is the MOST IMPORTANT rule.

Every learning unit MUST appear exactly once.

A learning unit may NEVER appear in two lessons.

Examples

Stories

Definitions

Analogies

Applications

Misconceptions

Scripture references

Explanations

must never be repeated in another lesson.

If a concept has already been covered,

later lessons should build upon it,

NOT explain it again.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LESSON SIZING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Avoid lessons that are too small.

Avoid lessons that are too large.

Aim for lessons representing approximately:

8–20 minutes of focused learning.

If a lesson becomes too broad,

split it.

If two lessons become too small,

merge them only if they teach the same concept.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TITLE GENERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate professional textbook-quality titles.

Titles must precisely describe the lesson.

Every title must be unique.

Avoid repetitive wording.

Bad examples:

Introduction

Basics

Overview

More About...

Advanced Concepts

Part II

Good examples:

The Five Essential Limbs of Bhakti

Personal and Impersonal Conceptions of God

Preparing the Mind for Deity Worship

Forms of Deity Manifestation

Consciousness During Worship

Offerings and Devotional Intention

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEARNING FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Always organize concepts from

Foundations

↓

Core Principles

↓

Theory

↓

Practical Understanding

↓

Applications

↓

Advanced Topics

Prerequisites must always appear before dependent lessons.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT QUALITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Each lesson should feel complete.

Whenever available from the source,

a lesson should naturally include:

• explanations

• examples

• analogies

• definitions

• applications

• misconceptions

Do NOT split these across multiple lessons unless they naturally belong elsewhere.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT TO AVOID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Never:

• duplicate concepts

• duplicate headings

• duplicate stories

• duplicate examples

• duplicate definitions

• duplicate applications

• duplicate analogies

• duplicate scripture references

• duplicate learning units

Never create overlapping chapters.

Never create overlapping lessons.

Never repeat content merely because it is important.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before producing JSON verify:

✓ every learning unit is assigned

✓ every learning unit appears exactly once

✓ every lesson teaches one objective

✓ every chapter is cohesive

✓ every module is independent

✓ no duplicate titles exist

✓ no repeated content exists

✓ educational progression is logical

✓ lesson sizes are balanced

✓ chapter sizes are balanced

✓ the curriculum resembles a professionally authored online course.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY a valid JSON object matching the required schema.

Do NOT output markdown.

Do NOT output explanations.

Do NOT output commentary.

Do NOT output bullet lists.

Do NOT output prose.

Output raw JSON only.
"""


class EducationalPlanningService:
    """
    Module 7: Educational Planning Engine.

    Does NOT generate lessons - it creates the curriculum. Learning order is
    computed deterministically via topological sort over the knowledge
    graph's `requires` edges; an LLM then groups the ordered concepts into
    modules/chapters/lessons with objectives and time estimates, instructed
    to preserve that order.
    """

    def __init__(self, llm_client: LLMClient | None = None):
        self.llm = llm_client or LLMClient(model="gemini-3.1-flash-lite")

    def plan(self, graph: KnowledgeGraph, units: LearningUnitSet, course_title: str) -> CoursePlan:
        if not units.units:
            raise PlanningError("Cannot plan a course with zero learning units.")

        ordered_ids = self._topological_order(graph, units)
        ordered_units = [u for uid in ordered_ids for u in units.units if u.id == uid]

        prompt = self._build_prompt(course_title, ordered_units)
        try:
            data = self.llm.complete_json(SYSTEM_PROMPT, prompt)
        except LLMError as e:
            raise PlanningError(f"Course planning failed: {e}") from e

        try:
            import json

            print("=" * 80)
            print(json.dumps(data, indent=2))
            print("=" * 80)
            return CoursePlan.from_dict(data)
        except (KeyError, TypeError) as e:
            raise PlanningError(f"LLM returned a malformed course plan: {e}") from e

    # -- topological ordering (deterministic, no AI) ------------------------

    @staticmethod
    def _topological_order(graph: KnowledgeGraph, units: LearningUnitSet) -> list[str]:
        unit_ids = {u.id for u in units.units}
        name_to_id = {u.topic.lower(): u.id for u in units.units}

        deps: dict[str, set[str]] = defaultdict(set)
        for unit in units.units:
            for prereq_name in unit.relationships:
                dep_id = name_to_id.get(prereq_name.lower())
                if dep_id and dep_id != unit.id:
                    deps[unit.id].add(dep_id)

        in_degree = {uid: len(deps[uid]) for uid in unit_ids}
        dependents: dict[str, list[str]] = defaultdict(list)
        for uid, dep_set in deps.items():
            for d in dep_set:
                dependents[d].append(uid)

        queue = deque(sorted(uid for uid, deg in in_degree.items() if deg == 0))
        order: list[str] = []
        while queue:
            current = queue.popleft()
            order.append(current)
            for dependent in sorted(dependents[current]):
                in_degree[dependent] -= 1
                if in_degree[dependent] == 0:
                    queue.append(dependent)

        # cycle fallback: append any remaining ids (best-effort, keeps pipeline moving)
        remaining = [uid for uid in unit_ids if uid not in order]
        order.extend(sorted(remaining))
        return order

    @staticmethod
    def _build_prompt(course_title: str, ordered_units) -> str:
        payload = [
            {
                "id": u.id,
                "topic": u.topic,
                "summary": u.summary,
                "keywords": u.keywords,
                "difficulty": u.difficulty,
            }
            for u in ordered_units
        ]
        return f"Course title: {course_title}\n\nLearning units in order:\n{json.dumps(payload, indent=2)}"
