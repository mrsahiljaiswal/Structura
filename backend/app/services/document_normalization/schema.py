from __future__ import annotations

from dataclasses import dataclass, field

from app.common.schema_base import JSONArtifact


@dataclass
class NormalizedBlock:
    text: str
    block_type: str  # paragraph | heading | list_item | table | caption
    page: int
    font_size: float | None = None
    bold: bool = False
    italic: bool = False


@dataclass
class NormalizedTable:
    table_id: str
    page: int
    rows: list[list[str]]


@dataclass
class NormalizedPage:
    page_number: int
    blocks: list[NormalizedBlock] = field(default_factory=list)
    tables: list[NormalizedTable] = field(default_factory=list)


@dataclass
class NormalizedDocument(JSONArtifact):
    source_path: str
    page_count: int
    pages: list[NormalizedPage] = field(default_factory=list)
    removed_headers: list[str] = field(default_factory=list)
    removed_footers: list[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict) -> "NormalizedDocument":
        pages = []
        for p in data.get("pages", []):
            blocks = [NormalizedBlock(**b) for b in p.get("blocks", [])]
            tables = [NormalizedTable(**t) for t in p.get("tables", [])]
            pages.append(NormalizedPage(page_number=p["page_number"], blocks=blocks, tables=tables))
        return cls(
            source_path=data["source_path"],
            page_count=data["page_count"],
            pages=pages,
            removed_headers=data.get("removed_headers", []),
            removed_footers=data.get("removed_footers", []),
        )
