from __future__ import annotations

from dataclasses import dataclass, field

from app.common.schema_base import JSONArtifact


@dataclass
class Concept:
    concept_id: str
    name: str
    keywords: list[str]
    definition: str | None
    difficulty: str  # beginner | intermediate | advanced
    importance: float  # 0-1
    prerequisites: list[str]  # concept names this depends on
    source_node_ids: list[str]
    pages: list[int]


@dataclass
class KnowledgeEdge:
    source: str  # concept name
    relation: str  # requires | uses | extends | contrasts_with
    target: str  # concept name


@dataclass
class KnowledgeGraph(JSONArtifact):
    concepts: list[Concept] = field(default_factory=list)
    edges: list[KnowledgeEdge] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict) -> "KnowledgeGraph":
        concepts = [Concept(**c) for c in data.get("concepts", [])]
        edges = [KnowledgeEdge(**e) for e in data.get("edges", [])]
        return cls(concepts=concepts, edges=edges)
