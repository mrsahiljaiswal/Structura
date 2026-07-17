from __future__ import annotations

from app.services.document_structure.schema import DocumentStructure, StructureNode
from app.services.knowledge_extraction.schema import Concept, KnowledgeGraph

from .exceptions import SegmentationError
from .schema import LearningUnit, LearningUnitSet

TEXT_CHAR_CAP = 6000


class SemanticSegmentationService:
    """
    Module 6: Semantic Segmentation Engine.

    Forget character-count chunking - one Learning Unit = one concept. Each
    unit pulls its full source text back from the structural nodes the
    concept was extracted from (Module 5's `source_node_ids`), so a unit
    contains the definition, examples, and explanation for that concept
    together, not an arbitrary character window.
    """

    def segment(self, structure: DocumentStructure, graph: KnowledgeGraph) -> LearningUnitSet:
        if not graph.concepts:
            raise SegmentationError("Cannot segment a knowledge graph with zero concepts.")

        node_index = self._index_nodes(structure.tree)
        units = [self._build_unit(concept, node_index) for concept in graph.concepts]
        return LearningUnitSet(units=units)

    @staticmethod
    def _index_nodes(root: StructureNode) -> dict[str, StructureNode]:
        index: dict[str, StructureNode] = {}

        def walk(n: StructureNode):
            index[n.node_id] = n
            for c in n.children:
                walk(c)

        walk(root)
        return index

    def _build_unit(self, concept: Concept, node_index: dict[str, StructureNode]) -> LearningUnit:
        text_parts = []
        for node_id in concept.source_node_ids:
            node = node_index.get(node_id)
            if node is None:
                continue
            text_parts.append(self._flatten_text(node))
        combined_text = "\n\n".join(p for p in text_parts if p)[:TEXT_CHAR_CAP]
        if not combined_text.strip():
            combined_text = (
                f"Concept: {concept.name}\n"
                f"Definition: {concept.definition or 'Inferred concept from relationship edges.'}\n"
                f"Keywords: {', '.join(concept.keywords or [concept.name.lower()])}"
            )

        return LearningUnit(
            id=concept.concept_id,
            topic=concept.name,
            summary=concept.definition,
            keywords=concept.keywords,
            difficulty=concept.difficulty,
            relationships=concept.prerequisites,
            pages=concept.pages,
            text=combined_text,
        )

    @staticmethod
    def _flatten_text(node: StructureNode) -> str:
        parts = []
        if node.title:
            parts.append(node.title)

        def walk(n: StructureNode):
            if n.level == "paragraph" and n.text:
                parts.append(n.text)
            for c in n.children:
                walk(c)

        walk(node)
        return "\n".join(parts)
