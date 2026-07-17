import pytest

from app.services.document_structure.schema import DocumentStructure, StructureNode
from app.services.knowledge_extraction.schema import Concept, KnowledgeGraph
from app.services.semantic_segmentation.exceptions import SegmentationError
from app.services.semantic_segmentation.service import SemanticSegmentationService
from app.services.semantic_segmentation.validator import SemanticSegmentationValidator


def _make_structure():
    para = StructureNode(node_id="p1", level="paragraph", title=None,
                          text="A transaction groups operations atomically.",
                          page_start=1, page_end=1)
    section = StructureNode(node_id="s1", level="section", title="Transactions", text=None,
                             page_start=1, page_end=1, children=[para])
    root = StructureNode(node_id="root", level="book", title="Book", text=None,
                          page_start=1, page_end=1, children=[section])
    return DocumentStructure(source_path="db.pdf", tree=root)


def _make_graph():
    concept = Concept(concept_id="transaction", name="Transaction", keywords=["ACID"],
                       definition="A unit of work.", difficulty="beginner", importance=0.9,
                       prerequisites=[], source_node_ids=["s1"], pages=[1])
    return KnowledgeGraph(concepts=[concept], edges=[])


def test_segment_pulls_source_text_for_each_concept():
    result = SemanticSegmentationService().segment(_make_structure(), _make_graph())
    assert len(result.units) == 1
    unit = result.units[0]
    assert unit.topic == "Transaction"
    assert "groups operations atomically" in unit.text
    assert "Transactions" in unit.text  # section title included


def test_segment_empty_graph_raises():
    with pytest.raises(SegmentationError):
        SemanticSegmentationService().segment(_make_structure(), KnowledgeGraph(concepts=[], edges=[]))


def test_validator_rejects_empty_text_unit():
    from app.services.semantic_segmentation.schema import LearningUnit, LearningUnitSet
    unit_set = LearningUnitSet(units=[LearningUnit(
        id="x", topic="X", summary=None, keywords=[], difficulty="beginner",
        relationships=[], pages=[], text="   ",
    )])
    with pytest.raises(SegmentationError):
        SemanticSegmentationValidator().validate(unit_set)
