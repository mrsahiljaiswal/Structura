from __future__ import annotations

from dataclasses import dataclass, field

from app.common.schema_base import JSONArtifact

NODE_LEVELS = ["book", "chapter", "section", "subsection", "paragraph"]


@dataclass
class StructureNode:
    node_id: str
    level: str  # book | chapter | section | subsection | paragraph
    title: str | None
    text: str | None
    page_start: int
    page_end: int
    node_type: str = "content"  # content | definition | example | algorithm | exercise | warning | note | figure | table | caption
    children: list["StructureNode"] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict) -> "StructureNode":
        children = [StructureNode.from_dict(c) for c in data.get("children", [])]
        return cls(
            node_id=data["node_id"], level=data["level"], title=data.get("title"),
            text=data.get("text"), page_start=data["page_start"], page_end=data["page_end"],
            node_type=data.get("node_type", "content"), children=children,
        )


@dataclass
class DocumentStructure(JSONArtifact):
    source_path: str
    tree: StructureNode

    @classmethod
    def from_dict(cls, data: dict) -> "DocumentStructure":
        return cls(source_path=data["source_path"], tree=StructureNode.from_dict(data["tree"]))
