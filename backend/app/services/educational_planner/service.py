from __future__ import annotations

import json
from collections import defaultdict, deque

from app.common.exceptions import LLMError
from app.common.llm_client import LLMClient
from app.services.knowledge_extraction.schema import KnowledgeGraph
from app.services.semantic_segmentation.schema import LearningUnitSet

from .exceptions import PlanningError
from .schema import CoursePlan, PlannedChapter, PlannedLesson, PlannedModule

SYSTEM_PROMPT = """You are the Educational Planning Engine in a document-intelligence pipeline. \
You act like a curriculum editor structuring uploaded PDF text. You are given a list of concepts/learning units \
extracted strictly from the PDF document in their exact original order plus a course title. \
Your job is to organize all points present in the PDF into a highly granular Course -> Modules -> Chapters -> Lessons structure.

GRANULAR SEGREGATION & NO REPETITION DIRECTIVE:
1. Divide concepts into MORE modules, MORE chapters, and MORE dedicated lessons to maximize educational depth.
2. Ensure strict segregation of topics: each chapter and lesson must focus on a distinct, dedicated sub-concept.
3. ABSOLUTELY AVOID repeating the same concepts, points, or titles across different chapters.
4. Base every chapter and lesson title strictly on the actual relevant contents and sub-topics present in the uploaded PDF.

CRITICAL: Respond ONLY with a single valid raw JSON object matching the schema below. Do NOT output markdown text, bullet points (* Module 1: ...), or prose commentary.

Example output format:
{
  "course_title": "...",
  "description": "1-2 sentence course description",
  "modules": [
    {
      "module_id": "m1",
      "title": "...",
      "chapters": [
        {
          "chapter_id": "m1c1",
          "title": "...",
          "lessons": [
            {
              "lesson_id": "m1c1l1",
              "title": "...",
              "learning_unit_ids": ["<ids from the input, exactly as given>"],
              "learning_objectives": ["...", "..."],
              "estimated_minutes": 15,
              "difficulty": "beginner",
              "prerequisites": ["<other lesson_ids in this plan, or []>"]
            }
          ]
        }
      ]
    }
  ]
}"""


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
