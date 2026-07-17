from __future__ import annotations

from dataclasses import dataclass, field

from app.common.schema_base import JSONArtifact


@dataclass
class BoundingBox:
    x0: float
    y0: float
    x1: float
    y1: float


@dataclass
class TextBlock:
    text: str
    font: str | None
    font_size: float | None
    bold: bool
    italic: bool
    bbox: BoundingBox
    block_type: str = "text"  # text | header | footer | list_item


@dataclass
class ImageObject:
    image_id: str
    bbox: BoundingBox
    width: int
    height: int
    ext: str


@dataclass
class TableObject:
    table_id: str
    bbox: BoundingBox
    rows: list[list[str]]


@dataclass
class ExtractedPage:
    page_number: int
    width: float
    height: float
    blocks: list[TextBlock] = field(default_factory=list)
    images: list[ImageObject] = field(default_factory=list)
    tables: list[TableObject] = field(default_factory=list)
    headers: list[str] = field(default_factory=list)
    footers: list[str] = field(default_factory=list)


@dataclass
class ExtractedDocument(JSONArtifact):
    source_path: str
    page_count: int
    metadata: dict
    pages: list[ExtractedPage] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict) -> "ExtractedDocument":
        pages = []
        for p in data.get("pages", []):
            blocks = [TextBlock(bbox=BoundingBox(**b.pop("bbox")), **b) for b in p.get("blocks", [])]
            images = [ImageObject(bbox=BoundingBox(**i.pop("bbox")), **i) for i in p.get("images", [])]
            tables = [TableObject(bbox=BoundingBox(**t.pop("bbox")), **t) for t in p.get("tables", [])]
            pages.append(ExtractedPage(
                page_number=p["page_number"], width=p["width"], height=p["height"],
                blocks=blocks, images=images, tables=tables,
                headers=p.get("headers", []), footers=p.get("footers", []),
            ))
        return cls(source_path=data["source_path"], page_count=data["page_count"],
                    metadata=data.get("metadata", {}), pages=pages)
