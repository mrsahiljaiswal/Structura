import re
from .exceptions import KnowledgeExtractionError
from .schema import Concept, KnowledgeGraph


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.strip().lower()).strip("-")


class KnowledgeExtractionValidator:
    def validate(self, graph: KnowledgeGraph) -> None:
        if not graph.concepts:
            raise KnowledgeExtractionError("Knowledge extraction produced zero concepts.")
        
        names = {c.name for c in graph.concepts}
        
        # Auto-repair graph: if source or target concept is missing, insert a stub concept
        for edge in graph.edges:
            if edge.source not in names:
                slug = _slug(edge.source)
                graph.concepts.append(
                    Concept(
                        concept_id=slug,
                        name=edge.source,
                        keywords=[edge.source.lower()],
                        definition="Inferred concept from relationship edges.",
                        difficulty="intermediate",
                        importance=0.5,
                        prerequisites=[],
                        source_node_ids=[],
                        pages=[]
                    )
                )
                names.add(edge.source)
                
            if edge.target not in names:
                slug = _slug(edge.target)
                graph.concepts.append(
                    Concept(
                        concept_id=slug,
                        name=edge.target,
                        keywords=[edge.target.lower()],
                        definition="Inferred concept from relationship edges.",
                        difficulty="intermediate",
                        importance=0.5,
                        prerequisites=[],
                        source_node_ids=[],
                        pages=[]
                    )
                )
                names.add(edge.target)

