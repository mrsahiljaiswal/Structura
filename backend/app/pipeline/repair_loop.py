# app/pipeline/repair_loop.py
from __future__ import annotations
import logging

from app.prompts.repair.repair_prompts import build_authoring_repair_prompt
from app.services.lesson_authoring.service import LessonAuthoringService
from app.services.lesson_authoring.exceptions import LessonAuthoringError
from app.services.lesson_review.service import EducationalReviewService
from app.services.lesson_review.schema import ReviewedLesson

logger = logging.getLogger(__name__)

MAX_REPAIR_ATTEMPTS = 2   # total re-authoring attempts after the first rejection


class LessonRepairLoop:
    """
    Wraps Author -> Review -> (if rejected) Repair -> Author -> Review, up
    to MAX_REPAIR_ATTEMPTS times, before giving up and returning the ReviewedLesson.
    This preserves the existing contract for callers: either you
    get back an approved ReviewedLesson, or an unapproved one.
    """

    def __init__(self, author: LessonAuthoringService, reviewer: EducationalReviewService):
        self.author = author
        self.reviewer = reviewer

    def author_and_review(self, planned_lesson, units, prerequisite_titles=None) -> ReviewedLesson:
        prereq_titles = prerequisite_titles or []
        lesson = self.author.author(planned_lesson, units, prereq_titles)
        reviewed = self.reviewer.review(lesson, units)

        attempt = 0
        while not reviewed.approved and attempt < MAX_REPAIR_ATTEMPTS:
            attempt += 1
            logger.info(
                "Lesson '%s' rejected (score=%s) — repair attempt %d/%d",
                planned_lesson.lesson_id, reviewed.quality_score, attempt, MAX_REPAIR_ATTEMPTS,
            )
            original_user_prompt = self.author.build_prompt(
                planned_lesson,
                [u for u in units.units if u.id in planned_lesson.learning_unit_ids],
                prereq_titles,
            )
            repair_prompt = build_authoring_repair_prompt(
                original_user_prompt=original_user_prompt,
                issues=[i.__dict__ for i in reviewed.issues],
                dimension_scores=reviewed.dimension_scores,
                max_attempts_note=MAX_REPAIR_ATTEMPTS - attempt + 1,
            )
            try:
                data = self.author.llm.complete_json(self.author._system_prompt, repair_prompt)
            except Exception as e:
                raise LessonAuthoringError(
                    f"Repair attempt {attempt} failed for lesson '{planned_lesson.lesson_id}': {e}"
                ) from e
            lesson = self.author.to_lesson(planned_lesson, data)
            reviewed = self.reviewer.review(lesson, units)

        if not reviewed.approved:
            logger.warning(
                "Lesson '%s' still unapproved after %d repair attempts — surfacing for manual review.",
                planned_lesson.lesson_id, MAX_REPAIR_ATTEMPTS,
            )
        return reviewed
