from __future__ import annotations

import json
import logging
from collections import defaultdict, deque

from app.common.exceptions import LLMError
from app.common.llm_client import LLMClient
from app.services.knowledge_extraction.schema import KnowledgeGraph
from app.services.semantic_segmentation.schema import LearningUnitSet
from .prompt_builder import build_system_prompt


from .exceptions import PlanningError
from .normalizer import normalize_course_plan
from .parser import CoursePlanParser
from .schema import CoursePlan
from .validator import (
    EducationalPlanningValidator,
    PlanningValidationError,
)

logger = logging.getLogger(__name__)



class EducationalPlanningService:
    """
    Module 7: Educational Planning Engine.

    Responsibilities:
    - Compute deterministic learning order
    - Ask the LLM to design the curriculum
    - Normalize the LLM response
    - Parse into dataclasses
    - Validate the final course plan

    This service intentionally contains no business logic.
    """

    def __init__(self, llm_client: LLMClient | None = None):
        self.llm = llm_client or LLMClient(model="gemini-3.1-flash-lite")
        self.validator = EducationalPlanningValidator()

    def plan(
        self,
        graph: KnowledgeGraph,
        units: LearningUnitSet,
        course_title: str,
    ) -> CoursePlan:

        if not units.units:
            raise PlanningError("Cannot plan a course with zero learning units.")

        logger.info("Starting educational planning for '%s'", course_title)

        ordered_ids = self._topological_order(graph, units)
        ordered_units = [
            u
            for uid in ordered_ids
            for u in units.units
            if u.id == uid
        ]

        prompt = self._build_prompt(course_title, ordered_units)

        try:
            raw_plan = self.llm.complete_json(
                build_system_prompt(),
                prompt,
            )
        except LLMError as e:
            raise PlanningError(
                f"Course planning failed: {e}"
            ) from e

        try:
            normalized_plan = normalize_course_plan(raw_plan)

            course_plan = CoursePlanParser.parse(
                normalized_plan
            )

            self.validator.validate(course_plan)

            logger.info(
                "Successfully generated curriculum with %d modules.",
                len(course_plan.modules),
            )

            return course_plan

        except PlanningValidationError as e:
            raise PlanningError(
                f"Generated course plan is invalid: {e}"
            ) from e

        except (KeyError, TypeError, ValueError) as e:
            raise PlanningError(
                f"Failed to parse course plan: {e}"
            ) from e

        except Exception as e:
            logger.exception("Unexpected planning error")
            raise PlanningError(
                f"Unexpected planning failure: {e}"
            ) from e

    # ------------------------------------------------------------------
    # Deterministic Topological Ordering
    # ------------------------------------------------------------------

    @staticmethod
    def _topological_order(
        graph: KnowledgeGraph,
        units: LearningUnitSet,
    ) -> list[str]:

        unit_ids = {u.id for u in units.units}
        name_to_id = {
            u.topic.lower(): u.id
            for u in units.units
        }

        dependencies: dict[str, set[str]] = defaultdict(set)

        for unit in units.units:
            for prerequisite in unit.relationships:

                dependency_id = name_to_id.get(
                    prerequisite.lower()
                )

                if (
                    dependency_id
                    and dependency_id != unit.id
                ):
                    dependencies[unit.id].add(
                        dependency_id
                    )

        in_degree = {
            uid: len(dependencies[uid])
            for uid in unit_ids
        }

        dependents: dict[str, list[str]] = defaultdict(list)

        for unit_id, prereqs in dependencies.items():
            for prereq in prereqs:
                dependents[prereq].append(unit_id)

        queue = deque(
            sorted(
                uid
                for uid, degree in in_degree.items()
                if degree == 0
            )
        )

        ordering: list[str] = []

        while queue:

            current = queue.popleft()

            ordering.append(current)

            for dependent in sorted(dependents[current]):

                in_degree[dependent] -= 1

                if in_degree[dependent] == 0:
                    queue.append(dependent)

        remaining = sorted(
            uid
            for uid in unit_ids
            if uid not in ordering
        )

        ordering.extend(remaining)

        return ordering

    # ------------------------------------------------------------------
    # Prompt Builder
    # ------------------------------------------------------------------

    @staticmethod
    def _build_prompt(
        course_title: str,
        ordered_units,
    ) -> str:

        payload = [
            {
                "id": unit.id,
                "topic": unit.topic,
                "summary": unit.summary,
                "keywords": unit.keywords,
                "difficulty": unit.difficulty,
            }
            for unit in ordered_units
        ]

        return (
            f"Course title: {course_title}\n\n"
            f"Learning units in order:\n"
            f"{json.dumps(payload, indent=2)}"
        )