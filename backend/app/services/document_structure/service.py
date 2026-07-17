from __future__ import annotations

import re
import uuid

from app.services.document_normalization.schema import NormalizedDocument

from .exceptions import StructureError
from .schema import DocumentStructure, StructureNode

HEADING_LEVELS = ["chapter", "section", "subsection"]

TYPE_PATTERNS = [
    ("definition", re.compile(r"^\s*(definition|def\.)\s*[:\-]", re.IGNORECASE)),
    ("example", re.compile(r"^\s*(example|e\.g\.)\s*[:\-]", re.IGNORECASE)),
    ("algorithm", re.compile(r"^\s*(algorithm)\s*[:\-]?", re.IGNORECASE)),
    ("exercise", re.compile(r"^\s*(exercise|problem)\s*\d*\s*[:\-]?", re.IGNORECASE)),
    ("warning", re.compile(r"^\s*(warning|caution)\s*[:\-]", re.IGNORECASE)),
    ("note", re.compile(r"^\s*(note)\s*[:\-]", re.IGNORECASE)),
    ("figure", re.compile(r"^\s*(figure|fig\.)\s*\d+", re.IGNORECASE)),
    ("caption", re.compile(r"^\s*(table)\s*\d+", re.IGNORECASE)),
]


def _new_id() -> str:
    return uuid.uuid4().hex[:10]


class DocumentStructureService:
    """
    Module 4: Document Structure Engine.

    Builds a Book -> Chapter -> Section -> Subsection -> Paragraph tree from
    the normalized, flat, per-page blocks. Heading levels are inferred by
    clustering the distinct font sizes used by blocks already classified as
    `heading` in Module 2 - the largest few sizes become chapter/section/
    subsection, from largest to smallest. No AI is used; this is purely
    structural/typographic.
    """

    def build(self, normalized: NormalizedDocument, title: str | None = None) -> DocumentStructure:
        if not normalized.pages:
            raise StructureError("Cannot build structure from a document with zero pages.")

        heading_sizes = self._heading_font_sizes(normalized)
        size_to_level = self._map_sizes_to_levels(heading_sizes)

        root = StructureNode(
            node_id=_new_id(), level="book", title=title or normalized.source_path,
            text=None, page_start=normalized.pages[0].page_number,
            page_end=normalized.pages[-1].page_number,
        )

        # stack[0] is always the book root; stack[i] is the current open node at HEADING_LEVELS[i-1]
        stack: list[StructureNode] = [root]

        for page in normalized.pages:
            for block in page.blocks:
                if block.block_type == "heading":
                    level = size_to_level.get(block.font_size, HEADING_LEVELS[-1])
                    node = StructureNode(
                        node_id=_new_id(), level=level, title=block.text, text=None,
                        page_start=page.page_number, page_end=page.page_number,
                    )
                    self._attach_heading(stack, level, node)
                else:
                    node_type = self._classify_type(block.text)
                    leaf = StructureNode(
                        node_id=_new_id(), level="paragraph", title=None, text=block.text,
                        page_start=page.page_number, page_end=page.page_number,
                        node_type=node_type,
                    )
                    parent = stack[-1]
                    parent.children.append(leaf)
                    parent.page_end = page.page_number

        self._propagate_page_ends(root)
        return DocumentStructure(source_path=normalized.source_path, tree=root)

    # -- heading level inference --------------------------------------------------

    @staticmethod
    def _heading_font_sizes(normalized: NormalizedDocument) -> list[float]:
        sizes = set()
        for page in normalized.pages:
            for block in page.blocks:
                if block.block_type == "heading" and block.font_size:
                    sizes.add(block.font_size)
        return sorted(sizes, reverse=True)

    @staticmethod
    def _map_sizes_to_levels(sizes: list[float]) -> dict[float, str]:
        mapping = {}
        for size, level in zip(sizes, HEADING_LEVELS):
            mapping[size] = level
        # any remaining, smaller heading sizes all collapse into the smallest level
        for size in sizes[len(HEADING_LEVELS):]:
            mapping[size] = HEADING_LEVELS[-1]
        return mapping

    @staticmethod
    def _attach_heading(stack: list[StructureNode], level: str, node: StructureNode) -> None:
        depth = HEADING_LEVELS.index(level) + 1  # 1=chapter, 2=section, 3=subsection
        # trim the stack back to the correct parent depth, then attach
        while len(stack) > depth:
            stack.pop()
        while len(stack) < depth:
            # a section appeared with no chapter yet - synthesize an implicit parent
            filler_level = HEADING_LEVELS[len(stack) - 1]
            filler = StructureNode(
                node_id=_new_id(), level=filler_level, title=None, text=None,
                page_start=node.page_start, page_end=node.page_start,
            )
            stack[-1].children.append(filler)
            stack.append(filler)
        stack[-1].children.append(node)
        stack.append(node)

    @staticmethod
    def _classify_type(text: str) -> str:
        for node_type, pattern in TYPE_PATTERNS:
            if pattern.match(text):
                return node_type
        return "content"

    def _propagate_page_ends(self, node: StructureNode) -> None:
        for child in node.children:
            self._propagate_page_ends(child)
            node.page_end = max(node.page_end, child.page_end)
