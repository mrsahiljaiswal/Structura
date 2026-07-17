import pytest

from app.services.course_assembly.exceptions import AssemblyError
from app.services.course_assembly.service import CourseAssemblyService
from app.services.course_assembly.validator import CourseAssemblyValidator
from app.services.educational_planner.schema import (
    CoursePlan,
    PlannedChapter,
    PlannedLesson,
    PlannedModule,
)
from app.services.lesson_authoring.schema import Lesson
from app.services.lesson_review.schema import ReviewedLesson


def _make_lesson(lid: str, content_size: str = "normal") -> Lesson:
    """Create a lesson with variable content size for testing word count."""
    base_text = "This is a sample lesson about a database concept. "
    if content_size == "short":
        multiplier = 1
    elif content_size == "long":
        multiplier = 5
    else:
        multiplier = 2

    return Lesson(
        lesson_id=lid,
        title=f"Lesson {lid}",
        overview=base_text * multiplier,
        theory=(
            "In this section, we explore the theoretical foundations. "
            "The concept is fundamental to understanding the broader system. "
        ) * (multiplier * 3),
        definitions=[f"Term {i}: A definition phrase." for i in range(multiplier)],
        examples=["An example code snippet."] * multiplier,
        analogies=["An analogy for understanding."],
        misconceptions=["A common misconception and why it is wrong."],
        applications=["Real-world use case."],
        summary="A brief wrap-up of the key points.",
        key_takeaways=["Key point 1", "Key point 2"],
        learning_unit_ids=[f"unit_{lid}"],
    )


def _make_reviewed(lesson: Lesson, score: int = 85) -> ReviewedLesson:
    return ReviewedLesson(lesson=lesson, quality_score=score, issues=[], approved=True)


def test_assemble_creates_course_with_statistics():
    plan = CoursePlan(
        course_title="DB Basics",
        description="A foundational course",
        modules=[
            PlannedModule(module_id="m1", title="Transactions", chapters=[
                PlannedChapter(chapter_id="c1", title="ACID", lessons=[
                    PlannedLesson(lesson_id="l1", title="Transactions", learning_unit_ids=["u1"],
                                   learning_objectives=[], estimated_minutes=15,
                                   difficulty="beginner", prerequisites=[]),
                    PlannedLesson(lesson_id="l2", title="Consistency", learning_unit_ids=["u2"],
                                   learning_objectives=[], estimated_minutes=20,
                                   difficulty="intermediate", prerequisites=["l1"]),
                ]),
            ]),
        ],
    )

    lessons = {
        "l1": _make_reviewed(_make_lesson("l1"), score=88),
        "l2": _make_reviewed(_make_lesson("l2", content_size="long"), score=82),
    }

    course = CourseAssemblyService().assemble(plan, lessons)

    assert course.course_title == "DB Basics"
    assert len(course.modules) == 1
    assert len(course.modules[0].chapters[0].lessons) == 2
    assert course.statistics.total_lessons == 2
    assert course.statistics.total_word_count > 0
    assert course.statistics.total_reading_time_minutes > 0
    assert course.statistics.average_quality_score == pytest.approx(85.0)


def test_assemble_rejects_unapproved_lesson():
    plan = CoursePlan(
        course_title="Test",
        description="",
        modules=[
            PlannedModule(module_id="m1", title="M1", chapters=[
                PlannedChapter(chapter_id="c1", title="C1", lessons=[
                    PlannedLesson(lesson_id="l1", title="L1", learning_unit_ids=[],
                                   learning_objectives=[], estimated_minutes=10,
                                   difficulty="beginner", prerequisites=[]),
                ]),
            ]),
        ],
    )

    approved = {}  # no approved lessons

    with pytest.raises(AssemblyError):
        CourseAssemblyService().assemble(plan, approved)


def test_assemble_builds_dependency_graph():
    plan = CoursePlan(
        course_title="Test",
        description="",
        modules=[
            PlannedModule(module_id="m1", title="M1", chapters=[
                PlannedChapter(chapter_id="c1", title="C1", lessons=[
                    PlannedLesson(lesson_id="l1", title="L1", learning_unit_ids=[],
                                   learning_objectives=[], estimated_minutes=10,
                                   difficulty="beginner", prerequisites=[]),
                    PlannedLesson(lesson_id="l2", title="L2", learning_unit_ids=[],
                                   learning_objectives=[], estimated_minutes=10,
                                   difficulty="beginner", prerequisites=["l1", "l0"]),
                ]),
            ]),
        ],
    )

    lessons = {
        "l1": _make_reviewed(_make_lesson("l1")),
        "l2": _make_reviewed(_make_lesson("l2")),
    }

    course = CourseAssemblyService().assemble(plan, lessons)
    assert course.dependencies["l1"] == []
    assert course.dependencies["l2"] == ["l0", "l1"]  # sorted


def test_validator_rejects_empty_course():
    from app.services.course_assembly.schema import FinalCourse, CourseStatistics

    course = FinalCourse(
        course_title="Empty",
        description="",
        modules=[],
        statistics=CourseStatistics(total_lessons=0, total_word_count=0, total_reading_time_minutes=0),
    )

    with pytest.raises(AssemblyError):
        CourseAssemblyValidator().validate(course)


def test_validator_rejects_bad_dependency_graph():
    from app.services.course_assembly.schema import (
        AssembledModule,
        CourseStatistics,
        FinalCourse,
    )

    course = FinalCourse(
        course_title="Bad Deps",
        description="",
        modules=[AssembledModule(module_id="m1", title="M1", chapters=[])],
        statistics=CourseStatistics(total_lessons=1, total_word_count=100, total_reading_time_minutes=1),
        dependencies={"l1": ["nonexistent"]},
    )

    with pytest.raises(AssemblyError):
        CourseAssemblyValidator().validate(course)
