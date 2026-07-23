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
            raise ExtractionError(f"Document file not found: {pdf_path}")

        ext = path.suffix.lower()
        if ext in {".docx", ".doc"}:
            return self._extract_docx(path)
        elif ext in {".pptx", ".ppt"}:
            return self._extract_pptx(path)
        elif ext in {".txt", ".md"}:
            return self._extract_txt(path)
        else:
            return self._extract_pdf(path)

    def _extract_pdf(self, path: Path) -> ExtractedDocument:
        try:
            import fitz  # PyMuPDF
        except ImportError as e:
            raise ExtractionError(
                "PyMuPDF is required for PDF extraction. Install with `pip install pymupdf`."
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

    def _extract_docx(self, docx_path: Path) -> ExtractedDocument:
        try:
            import docx
        except ImportError as e:
            raise ExtractionError(
                "python-docx is required for Word extraction. Install with `pip install python-docx`."
            ) from e

        try:
            doc = docx.Document(str(docx_path))
        except Exception as e:
            raise ExtractionError(f"Could not open Word document: {e}") from e

        pages: list[ExtractedPage] = []
        current_blocks: list[TextBlock] = []
        page_number = 1
        word_count = 0

        for para in doc.paragraphs:
            text = para.text.strip()
            if not text:
                continue

            style_name = para.style.name.lower() if para.style else ""
            bold = any(run.bold for run in para.runs if run.bold is not None)
            italic = any(run.italic for run in para.runs if run.italic is not None)

            font_size = 12.0
            if "heading 1" in style_name or "title" in style_name:
                font_size = 20.0
                bold = True
            elif "heading 2" in style_name:
                font_size = 16.0
                bold = True
            elif "heading 3" in style_name:
                font_size = 14.0
                bold = True

            current_blocks.append(TextBlock(
                text=text,
                font=para.style.name if para.style else "Normal",
                font_size=font_size,
                bold=bold,
                italic=italic,
                bbox=BoundingBox(0, 0, 100, 100),
            ))

            word_count += len(text.split())
            if word_count >= 400:
                pages.append(ExtractedPage(page_number=page_number, blocks=current_blocks, images=[], tables=[]))
                page_number += 1
                current_blocks = []
                word_count = 0

        for table in doc.tables:
            table_text_lines = []
            for row in table.rows:
                row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_text:
                    table_text_lines.append(" | ".join(row_text))
            if table_text_lines:
                current_blocks.append(TextBlock(
                    text="\n".join(table_text_lines),
                    font="TableText",
                    font_size=11.0,
                    bold=False,
                    italic=False,
                    bbox=BoundingBox(0, 0, 100, 100),
                ))

        if current_blocks or not pages:
            pages.append(ExtractedPage(page_number=page_number, blocks=current_blocks, images=[], tables=[]))

        return ExtractedDocument(
            source_path=str(docx_path),
            page_count=len(pages),
            metadata={"title": docx_path.stem},
            pages=pages,
        )

    def _extract_pptx(self, pptx_path: Path) -> ExtractedDocument:
        try:
            import pptx
        except ImportError as e:
            raise ExtractionError(
                "python-pptx is required for PowerPoint extraction. Install with `pip install python-pptx`."
            ) from e

        try:
            prs = pptx.Presentation(str(pptx_path))
        except Exception as e:
            raise ExtractionError(f"Could not open PowerPoint presentation: {e}") from e

        pages: list[ExtractedPage] = []

        for slide_index, slide in enumerate(prs.slides):
            blocks: list[TextBlock] = []
            for shape in slide.shapes:
                if not shape.has_text_frame:
                    continue
                for paragraph in shape.text_frame.paragraphs:
                    text = paragraph.text.strip()
                    if not text:
                        continue

                    bold = any(run.font.bold for run in paragraph.runs if run.font and run.font.bold is not None)
                    italic = any(run.font.italic for run in paragraph.runs if run.font and run.font.italic is not None)
                    font_size = 14.0
                    if paragraph.runs and paragraph.runs[0].font and paragraph.runs[0].font.size:
                        try:
                            font_size = float(paragraph.runs[0].font.size.pt)
                        except Exception:
                            font_size = 14.0

                    if shape == slide.shapes.title:
                        font_size = 22.0
                        bold = True

                    blocks.append(TextBlock(
                        text=text,
                        font="SlideText",
                        font_size=font_size,
                        bold=bold,
                        italic=italic,
                        bbox=BoundingBox(0, 0, 100, 100),
                    ))

            pages.append(ExtractedPage(
                page_number=slide_index + 1,
                blocks=blocks,
                images=[],
                tables=[],
            ))

        if not pages:
            pages.append(ExtractedPage(page_number=1, blocks=[], images=[], tables=[]))

        return ExtractedDocument(
            source_path=str(pptx_path),
            page_count=len(pages),
            metadata={"title": pptx_path.stem},
            pages=pages,
        )

    def _extract_txt(self, txt_path: Path) -> ExtractedDocument:
        try:
            with open(txt_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        except Exception as e:
            raise ExtractionError(f"Could not read text file: {e}") from e

        lines = content.splitlines()
        pages: list[ExtractedPage] = []
        current_blocks: list[TextBlock] = []
        page_number = 1

        for line in lines:
            trimmed = line.strip()
            if not trimmed:
                continue

            is_heading = trimmed.startswith("#")
            font_size = 18.0 if is_heading else 12.0
            bold = is_heading

            current_blocks.append(TextBlock(
                text=trimmed,
                font="Markdown" if txt_path.suffix.lower() == ".md" else "PlainText",
                font_size=font_size,
                bold=bold,
                italic=False,
                bbox=BoundingBox(0, 0, 100, 100),
            ))

            if len(current_blocks) >= 40:
                pages.append(ExtractedPage(page_number=page_number, blocks=current_blocks, images=[], tables=[]))
                page_number += 1
                current_blocks = []

        if current_blocks or not pages:
            pages.append(ExtractedPage(page_number=page_number, blocks=current_blocks, images=[], tables=[]))

        return ExtractedDocument(
            source_path=str(txt_path),
            page_count=len(pages),
            metadata={"title": txt_path.stem},
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
