import json

import pytest

from app.common.llm_client import LLMClient
from app.services.educational_planner.schema import (
    CoursePlan,
    PlannedChapter,
    PlannedLesson,
    PlannedModule,
)
from app.services.lesson_authoring.exceptions import LessonAuthoringError
from app.services.lesson_authoring.service import LessonAuthoringService
from app.services.lesson_authoring.validator import LessonAuthoringValidator
from app.services.semantic_segmentation.schema import LearningUnit, LearningUnitSet

GOOD_LESSON_RESPONSE = {
    "overview": "This lesson covers what a database transaction is and why it matters.",
    "theory": "A transaction bundles one or more operations into a single atomic unit of work. "
              "If any part fails, the whole transaction is rolled back, preventing partial updates.",
    "definitions": ["Transaction: a unit of work that is atomic."],
    "examples": ["BEGIN; UPDATE accounts SET balance = balance - 100; COMMIT;"],
    "analogies": ["Like a bank transfer that either fully completes or doesn't happen at all."],
    "misconceptions": ["Thinking a transaction is just 'a database query'."],
    "applications": ["Bank transfers", "Order processing"],
    "summary": "Transactions guarantee atomic, all-or-nothing updates.",
    "key_takeaways": ["Transactions are atomic.", "Failures roll back cleanly."],
}


def _make_units():
    return LearningUnitSet(units=[
        LearningUnit(id="transaction", topic="Transaction", summary="A unit of work.",
                     keywords=["ACID"], difficulty="beginner", relationships=[], pages=[1],
                     text="A transaction groups operations atomically."),
    ])


def _make_planned_lesson():
    return PlannedLesson(
        lesson_id="l1", title="Understanding Transactions", learning_unit_ids=["transaction"],
        learning_objectives=["Understand what a transaction is"], estimated_minutes=10,
        difficulty="beginner", prerequisites=[],
    )


def test_author_produces_valid_lesson():
    client = LLMClient(fake_responder=lambda s, u: json.dumps(GOOD_LESSON_RESPONSE))
    lesson = LessonAuthoringService(llm_client=client).author(_make_planned_lesson(), _make_units())
    assert lesson.lesson_id == "l1"
    assert "atomic" in lesson.theory
    assert len(lesson.key_takeaways) == 2
    LessonAuthoringValidator().validate(lesson)  # should not raise


def test_author_missing_learning_unit_raises():
    planned = PlannedLesson(lesson_id="l2", title="Ghost Lesson", learning_unit_ids=["does-not-exist"],
                             learning_objectives=[], estimated_minutes=5, difficulty="beginner",
                             prerequisites=[])
    client = LLMClient(fake_responder=lambda s, u: json.dumps(GOOD_LESSON_RESPONSE))
    with pytest.raises(LessonAuthoringError):
        LessonAuthoringService(llm_client=client).author(planned, _make_units())


def test_author_missing_required_field_raises():
    bad = dict(GOOD_LESSON_RESPONSE)
    bad.pop("theory")
    client = LLMClient(fake_responder=lambda s, u: json.dumps(bad))
    with pytest.raises(LessonAuthoringError):
        LessonAuthoringService(llm_client=client).author(_make_planned_lesson(), _make_units())


def test_validator_rejects_short_theory():
    from app.services.lesson_authoring.schema import Lesson
    lesson = Lesson(lesson_id="l1", title="X", overview="ok", theory="too short",
                     key_takeaways=["a"])
    with pytest.raises(LessonAuthoringError):
        LessonAuthoringValidator().validate(lesson)


def test_author_all_wires_prerequisite_titles():
    units = _make_units()
    l1 = _make_planned_lesson()
    l2 = PlannedLesson(lesson_id="l2", title="ACID", learning_unit_ids=["transaction"],
                        learning_objectives=[], estimated_minutes=10, difficulty="intermediate",
                        prerequisites=["l1"])
    plan = CoursePlan(course_title="DB", description="", modules=[
        PlannedModule(module_id="m1", title="M1", chapters=[
            PlannedChapter(chapter_id="c1", title="C1", lessons=[l1, l2]),
        ]),
    ])

    seen_prereqs = []

    def responder(system, user):
        seen_prereqs.append("Understanding Transactions" in user)
        return json.dumps(GOOD_LESSON_RESPONSE)

    client = LLMClient(fake_responder=responder)
    lessons = LessonAuthoringService(llm_client=client).author_all(plan, units)
    assert len(lessons) == 2
    assert seen_prereqs[-1] is True  # l2's prompt mentioned l1's title as a completed prerequisite
