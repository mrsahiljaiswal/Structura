from __future__ import annotations

import uuid
from pathlib import Path

from .exceptions import ExtractionError
from .schema import (
    BoundingBox,
    ExtractedDocument,
    ExtractedPage,
    ImageObject,
    TableObject,
    TextBlock,
)


class DocumentExtractionService:
    """
    Module 1: Document Extraction Engine.

    Converts a PDF into raw structured information: text with font/style/
    position metadata, images, tables, and document metadata.

    Explicitly NOT this module's job: cleanup (Module 2), classification
    (Module 3), or hierarchy (Module 4). This module only extracts.
    """

    def extract(self, pdf_path: str) -> ExtractedDocument:
        path = Path(pdf_path)
        if not path.exists():
            raise ExtractionError(f"PDF not found: {pdf_path}")

        try:
            import fitz  # PyMuPDF
        except ImportError as e:
            raise ExtractionError(
                "PyMuPDF is required for extraction. Install with `pip install pymupdf`."
            ) from e

        try:
            doc = fitz.open(str(path))
        except Exception as e:
            raise ExtractionError(f"Could not open PDF: {e}") from e

        pages: list[ExtractedPage] = []
        try:
            for page_index in range(doc.page_count):
                page = doc.load_page(page_index)
                pages.append(self._extract_page(page, page_index + 1))
        finally:
            metadata = dict(doc.metadata or {})
            doc.close()

        return ExtractedDocument(
            source_path=str(path),
            page_count=len(pages),
            metadata=metadata,
            pages=pages,
        )

    def _extract_page(self, page, page_number: int) -> ExtractedPage:
        import fitz

        rect = page.rect
        text_dict = page.get_text("dict")
        blocks: list[TextBlock] = []

        for block in text_dict.get("blocks", []):
            if block.get("type") != 0:  # 0 = text block, 1 = image block
                continue
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    text = span.get("text", "")
                    if not text.strip():
                        continue
                    flags = span.get("flags", 0)
                    font_name = span.get("font", "")
                    bold = bool(flags & (1 << 4)) or "bold" in font_name.lower()
                    italic = bool(flags & (1 << 1)) or "italic" in font_name.lower() or "oblique" in font_name.lower()
                    bx = span.get("bbox", [0, 0, 0, 0])
                    blocks.append(TextBlock(
                        text=text,
                        font=font_name,
                        font_size=round(span.get("size", 0), 2),
                        bold=bold,
                        italic=italic,
                        bbox=BoundingBox(*bx),
                    ))

        images: list[ImageObject] = []
        for img in page.get_images(full=True):
            xref = img[0]
            try:
                rects = page.get_image_rects(xref)
                bbox = rects[0] if rects else fitz.Rect(0, 0, 0, 0)
                base = page.parent.extract_image(xref)
                images.append(ImageObject(
                    image_id=f"p{page_number}_img{xref}",
                    bbox=BoundingBox(bbox.x0, bbox.y0, bbox.x1, bbox.y1),
                    width=base.get("width", 0),
                    height=base.get("height", 0),
                    ext=base.get("ext", "png"),
                ))
            except Exception:
                continue

        tables = self._extract_tables(page, page_number)

        return ExtractedPage(
            page_number=page_number,
            width=rect.width,
            height=rect.height,
            blocks=blocks,
            images=images,
            tables=tables,
        )

    def _extract_tables(self, page, page_number: int) -> list[TableObject]:
        """Best-effort table extraction via pdfplumber. Silently skipped if unavailable."""
        tables: list[TableObject] = []
        try:
            import pdfplumber
        except ImportError:
            return tables

        try:
            with pdfplumber.open(page.parent.name) as pdf:
                pl_page = pdf.pages[page_number - 1]
                for i, table in enumerate(pl_page.find_tables()):
                    rows = table.extract() or []
                    x0, top, x1, bottom = table.bbox
                    tables.append(TableObject(
                        table_id=f"p{page_number}_t{i}_{uuid.uuid4().hex[:6]}",
                        bbox=BoundingBox(x0, top, x1, bottom),
                        rows=[[cell or "" for cell in row] for row in rows],
                    ))
        except Exception:
            return tables
        return tables
