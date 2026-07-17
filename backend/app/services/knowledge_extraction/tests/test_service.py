import json

import pytest

from app.common.llm_client import LLMClient
from app.services.document_structure.schema import DocumentStructure, StructureNode
from app.services.knowledge_extraction.exceptions import KnowledgeExtractionError
from app.services.knowledge_extraction.service import KnowledgeExtractionService
from app.services.knowledge_extraction.validator import KnowledgeExtractionValidator


def _make_structure():
    para1 = StructureNode(node_id="p1", level="paragraph", title=None,
                           text="A transaction groups operations atomically.",
                           page_start=1, page_end=1)
    section1 = StructureNode(node_id="s1", level="section", title="Transactions",
                              text=None, page_start=1, page_end=1, children=[para1])
    para2 = StructureNode(node_id="p2", level="paragraph", title=None,
                           text="ACID guarantees rely on the transaction concept.",
                           page_start=2, page_end=2)
    section2 = StructureNode(node_id="s2", level="section", title="ACID",
                              text=None, page_start=2, page_end=2, children=[para2])
    chapter = StructureNode(node_id="c1", level="chapter", title="Storage", text=None,
                             page_start=1, page_end=2, children=[section1, section2])
    root = StructureNode(node_id="root", level="book", title="Book", text=None,
                          page_start=1, page_end=2, children=[chapter])
    return DocumentStructure(source_path="db.pdf", tree=root)


def _fake_responder_factory():
    responses = {
        "Transactions": {"concepts": [{
            "name": "Transaction", "keywords": ["ACID unit"], "definition": "A unit of work.",
            "difficulty": "beginner", "importance": 0.9, "prerequisites": [],
        }]},
        "ACID": {"concepts": [{
            "name": "ACID", "keywords": ["consistency"], "definition": "Guarantees for transactions.",
            "difficulty": "intermediate", "importance": 0.8, "prerequisites": ["Transaction"],
        }]},
    }

    def responder(system: str, user: str) -> str:
        for key, payload in responses.items():
            if user.startswith(f"Section: {key}"):
                return json.dumps(payload)
        return json.dumps({"concepts": []})

    return responder


def test_extract_builds_graph_with_edges():
    client = LLMClient(fake_responder=_fake_responder_factory())
    graph = KnowledgeExtractionService(llm_client=client).extract(_make_structure())

    names = {c.name for c in graph.concepts}
    assert names == {"Transaction", "ACID"}
    assert any(e.source == "ACID" and e.target == "Transaction" and e.relation == "requires"
               for e in graph.edges)


def test_extract_no_sections_raises():
    empty_root = StructureNode(node_id="root", level="book", title="Book", text=None,
                                page_start=1, page_end=1)
    structure = DocumentStructure(source_path="x.pdf", tree=empty_root)
    client = LLMClient(fake_responder=lambda s, u: json.dumps({"concepts": []}))
    with pytest.raises(KnowledgeExtractionError):
        KnowledgeExtractionService(llm_client=client).extract(structure)


def test_validator_rejects_empty_graph():
    from app.services.knowledge_extraction.schema import KnowledgeGraph
    with pytest.raises(KnowledgeExtractionError):
        KnowledgeExtractionValidator().validate(KnowledgeGraph(concepts=[], edges=[]))


def test_validator_rejects_dangling_edge():
    from app.services.knowledge_extraction.schema import Concept, KnowledgeEdge, KnowledgeGraph
    graph = KnowledgeGraph(
        concepts=[Concept(concept_id="a", name="A", keywords=[], definition=None,
                           difficulty="beginner", importance=0.5, prerequisites=[],
                           source_node_ids=[], pages=[])],
        edges=[KnowledgeEdge(source="A", relation="requires", target="Nonexistent")],
    )
    with pytest.raises(KnowledgeExtractionError):
        KnowledgeExtractionValidator().validate(graph)
