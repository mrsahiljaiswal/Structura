import json

import pytest

from app.common.llm_client import LLMClient
from app.services.educational_planner.exceptions import PlanningError
from app.services.educational_planner.service import EducationalPlanningService
from app.services.educational_planner.validator import EducationalPlanningValidator
from app.services.knowledge_extraction.schema import Concept, KnowledgeEdge, KnowledgeGraph
from app.services.semantic_segmentation.schema import LearningUnit, LearningUnitSet


def _make_units_and_graph():
    units = LearningUnitSet(units=[
        LearningUnit(id="acid", topic="ACID", summary="Guarantees.", keywords=[],
                     difficulty="intermediate", relationships=["Transaction"], pages=[2], text="ACID text"),
        LearningUnit(id="transaction", topic="Transaction", summary="Unit of work.", keywords=[],
                     difficulty="beginner", relationships=[], pages=[1], text="Transaction text"),
    ])
    graph = KnowledgeGraph(
        concepts=[
            Concept(concept_id="transaction", name="Transaction", keywords=[], definition=None,
                    difficulty="beginner", importance=0.9, prerequisites=[], source_node_ids=[], pages=[1]),
            Concept(concept_id="acid", name="ACID", keywords=[], definition=None,
                    difficulty="intermediate", importance=0.8, prerequisites=["Transaction"],
                    source_node_ids=[], pages=[2]),
        ],
        edges=[KnowledgeEdge(source="ACID", relation="requires", target="Transaction")],
    )
    return units, graph


def test_topological_order_respects_prerequisites():
    units, graph = _make_units_and_graph()
    order = EducationalPlanningService._topological_order(graph, units)
    assert order.index("transaction") < order.index("acid")


GOOD_PLAN = {
    "course_title": "Database Internals",
    "description": "A short course.",
    "modules": [{
        "module_id": "m1", "title": "Foundations",
        "chapters": [{
            "chapter_id": "m1c1", "title": "Transactions & ACID",
            "lessons": [
                {"lesson_id": "l1", "title": "Transaction", "learning_unit_ids": ["transaction"],
                 "learning_objectives": ["Understand transactions"], "estimated_minutes": 10,
                 "difficulty": "beginner", "prerequisites": []},
                {"lesson_id": "l2", "title": "ACID", "learning_unit_ids": ["acid"],
                 "learning_objectives": ["Understand ACID"], "estimated_minutes": 15,
                 "difficulty": "intermediate", "prerequisites": ["l1"]},
            ],
        }],
    }],
}


def test_plan_parses_llm_output():
    units, graph = _make_units_and_graph()
    client = LLMClient(fake_responder=lambda s, u: json.dumps(GOOD_PLAN))
    plan = EducationalPlanningService(llm_client=client).plan(graph, units, "Database Internals")
    assert plan.course_title == "Database Internals"
    assert plan.modules[0].chapters[0].lessons[1].prerequisites == ["l1"]


def test_plan_empty_units_raises():
    _, graph = _make_units_and_graph()
    client = LLMClient(fake_responder=lambda s, u: json.dumps(GOOD_PLAN))
    with pytest.raises(PlanningError):
        EducationalPlanningService(llm_client=client).plan(graph, LearningUnitSet(units=[]), "X")


def test_validator_rejects_unknown_prerequisite():
    units, graph = _make_units_and_graph()
    bad_plan = json.loads(json.dumps(GOOD_PLAN))
    bad_plan["modules"][0]["chapters"][0]["lessons"][1]["prerequisites"] = ["does-not-exist"]
    client = LLMClient(fake_responder=lambda s, u: json.dumps(bad_plan))
    plan = EducationalPlanningService(llm_client=client).plan(graph, units, "Database Internals")
    with pytest.raises(PlanningError):
        EducationalPlanningValidator().validate(plan)
