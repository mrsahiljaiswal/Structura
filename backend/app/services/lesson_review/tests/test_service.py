import json

import pytest

from app.common.llm_client import LLMClient
from app.services.lesson_authoring.schema import Lesson
from app.services.lesson_review.exceptions import ReviewError
from app.services.lesson_review.service import EducationalReviewService
from app.services.lesson_review.validator import EducationalReviewValidator
from app.services.semantic_segmentation.schema import LearningUnit, LearningUnitSet


def _make_lesson():
    return Lesson(
        lesson_id="l1", title="Transactions", overview="Covers transactions.",
        theory="A transaction is a unit of work that is atomic and isolated.",
        key_takeaways=["Transactions are atomic."], learning_unit_ids=["transaction"],
    )


def _make_units():
    return LearningUnitSet(units=[
        LearningUnit(id="transaction", topic="Transaction", summary="Unit of work.",
                     keywords=[], difficulty="beginner", relationships=[], pages=[1],
                     text="A transaction groups operations atomically."),
    ])


def test_review_approves_good_lesson():
    from app.prompts.critique.critique_framework import DIMENSIONS
    good = {
        "dimension_scores": {name: 88 for name in DIMENSIONS},
        "quality_score": 88,
        "issues": [],
        "approved": True
    }
    client = LLMClient(fake_responder=lambda s, u: json.dumps(good))
    reviewed = EducationalReviewService(llm_client=client).review(_make_lesson(), _make_units())
    assert reviewed.approved is True
    assert reviewed.quality_score == 88
    EducationalReviewValidator().validate(reviewed)  # should not raise


def test_review_enforces_approval_floor_despite_model_claim():
    from app.prompts.critique.critique_framework import DIMENSIONS
    # model says approved=True but there's a high severity issue - floor should override it
    conflicting = {
        "dimension_scores": {name: 90 for name in DIMENSIONS},
        "quality_score": 90,
        "issues": [{"category": "hallucination", "severity": "high", "dimension": "grounding",
                     "description": "Claims transactions are always distributed, unsupported."}],
        "approved": True,
    }
    client = LLMClient(fake_responder=lambda s, u: json.dumps(conflicting))
    reviewed = EducationalReviewService(llm_client=client).review(_make_lesson(), _make_units())
    assert reviewed.approved is False
    with pytest.raises(ReviewError):
        EducationalReviewValidator().validate(reviewed)


def test_review_low_score_not_approved():
    from app.prompts.critique.critique_framework import DIMENSIONS
    low = {
        "dimension_scores": {name: 40 for name in DIMENSIONS},
        "quality_score": 40,
        "issues": [{"category": "flow", "severity": "medium", "dimension": "flow",
                     "description": "Jumps between ideas."}],
        "approved": False
    }
    client = LLMClient(fake_responder=lambda s, u: json.dumps(low))
    reviewed = EducationalReviewService(llm_client=client).review(_make_lesson(), _make_units())
    assert reviewed.approved is False


def test_review_invalid_score_raises():
    from app.prompts.critique.critique_framework import DIMENSIONS
    bad = {
        "dimension_scores": {name: 90 for name in DIMENSIONS},
        "quality_score": 150,
        "issues": [],
        "approved": True
    }
    client = LLMClient(fake_responder=lambda s, u: json.dumps(bad))
    with pytest.raises(ReviewError):
        EducationalReviewService(llm_client=client).review(_make_lesson(), _make_units())
