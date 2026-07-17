from __future__ import annotations

import statistics
from collections import Counter

from app.common.text_utils import clean_text, is_page_number
from app.services.document_extraction.schema import ExtractedDocument, ExtractedPage, TextBlock

from .exceptions import NormalizationError
from .schema import NormalizedBlock, NormalizedDocument, NormalizedPage, NormalizedTable

LINE_Y_TOLERANCE = 3.0
PARAGRAPH_GAP_MULTIPLIER = 1.6
HEADER_ZONE_RATIO = 0.08
FOOTER_ZONE_RATIO = 0.92
REPEAT_THRESHOLD = 0.6  # fraction of pages a line must appear on to be a header/footer


class DocumentNormalizationService:
    """
    Module 2: Document Normalization Engine.

    Transforms raw extraction into clean structured content: joined
    paragraphs, deduped repeated headers/footers/page numbers, dehyphenated
    words, normalized unicode/bullets/quotes. NO AI is used here — every
    decision is rule-based so the output is deterministic and cheap to run.
    """

    def normalize(self, extracted: ExtractedDocument) -> NormalizedDocument:
        if not extracted.pages:
            raise NormalizationError("Cannot normalize a document with zero pages.")

        repeated_lines = self._find_repeated_header_footer_lines(extracted.pages)

        pages: list[NormalizedPage] = []
        for page in extracted.pages:
            pages.append(self._normalize_page(page, repeated_lines))

        return NormalizedDocument(
            source_path=extracted.source_path,
            page_count=extracted.page_count,
            pages=pages,
            removed_headers=sorted(repeated_lines),
            removed_footers=[],
        )

    # -- header/footer detection -------------------------------------------------

    def _find_repeated_header_footer_lines(self, pages: list[ExtractedPage]) -> set[str]:
        counter: Counter[str] = Counter()
        for page in pages:
            zone_texts = set()
            for block in page.blocks:
                y_ratio = block.bbox.y0 / page.height if page.height else 0
                if y_ratio <= HEADER_ZONE_RATIO or y_ratio >= FOOTER_ZONE_RATIO:
                    normalized = clean_text(block.text).lower()
                    if normalized:
                        zone_texts.add(normalized)
            counter.update(zone_texts)

        n_pages = max(len(pages), 1)
        return {text for text, count in counter.items() if count / n_pages >= REPEAT_THRESHOLD}

    # -- per-page normalization ---------------------------------------------------

    def _normalize_page(self, page: ExtractedPage, repeated_lines: set[str]) -> NormalizedPage:
        body_blocks = []
        headers, footers = [], []

        for block in page.blocks:
            cleaned = clean_text(block.text)
            if not cleaned:
                continue
            normalized_key = cleaned.lower()
            y_ratio = block.bbox.y0 / page.height if page.height else 0

            if is_page_number(cleaned) or normalized_key in repeated_lines:
                if y_ratio <= HEADER_ZONE_RATIO:
                    headers.append(cleaned)
                else:
                    footers.append(cleaned)
                continue
            body_blocks.append(block)

        median_size = self._median_font_size(body_blocks)
        lines = self._group_into_lines(body_blocks)
        paragraphs = self._merge_lines_into_paragraphs(lines, median_size, page.page_number)

        tables = [
            NormalizedTable(table_id=t.table_id, page=page.page_number, rows=t.rows)
            for t in page.tables
        ]

        return NormalizedPage(page_number=page.page_number, blocks=paragraphs, tables=tables)

    @staticmethod
    def _median_font_size(blocks: list[TextBlock]) -> float:
        sizes = [b.font_size for b in blocks if b.font_size]
        return statistics.median(sizes) if sizes else 11.0

    @staticmethod
    def _group_into_lines(blocks: list[TextBlock]) -> list[list[TextBlock]]:
        ordered = sorted(blocks, key=lambda b: (round(b.bbox.y0 / LINE_Y_TOLERANCE), b.bbox.x0))
        lines: list[list[TextBlock]] = []
        current: list[TextBlock] = []
        current_y = None
        for block in ordered:
            if current_y is None or abs(block.bbox.y0 - current_y) <= LINE_Y_TOLERANCE:
                current.append(block)
                current_y = block.bbox.y0 if current_y is None else current_y
            else:
                lines.append(current)
                current = [block]
                current_y = block.bbox.y0
        if current:
            lines.append(current)
        return lines

    def _merge_lines_into_paragraphs(
        self, lines: list[list[TextBlock]], median_size: float, page_number: int
    ) -> list[NormalizedBlock]:
        paragraphs: list[NormalizedBlock] = []
        buffer_text: list[str] = []
        buffer_size = None
        buffer_bold = False
        buffer_italic = False
        prev_y = None
        prev_size = None

        def flush():
            if not buffer_text:
                return
            text = clean_text(" ".join(buffer_text))
            if not text:
                return
            block_type = self._classify_block(text, buffer_size, median_size, buffer_bold)
            paragraphs.append(NormalizedBlock(
                text=text, block_type=block_type, page=page_number,
                font_size=buffer_size, bold=buffer_bold, italic=buffer_italic,
            ))

        for line in lines:
            line_text = " ".join(b.text for b in line).strip()
            if not line_text:
                continue
            line_y = line[0].bbox.y0
            line_size = line[0].font_size
            line_bold = any(b.bold for b in line)
            line_italic = any(b.italic for b in line)
            line_height = (line_size or 11.0) * PARAGRAPH_GAP_MULTIPLIER

            starts_new_paragraph = (
                prev_y is not None and (line_y - prev_y) > line_height
            ) or (prev_size is not None and line_size and abs(line_size - prev_size) > 0.5)

            if starts_new_paragraph:
                flush()
                buffer_text = []

            buffer_text.append(line_text)
            buffer_size = line_size
            buffer_bold = line_bold
            buffer_italic = line_italic
            prev_y = line_y
            prev_size = line_size

        flush()
        return paragraphs

    @staticmethod
    def _classify_block(text: str, font_size: float | None, median_size: float, bold: bool) -> str:
        if text.startswith("- ") or text.startswith("* "):
            return "list_item"
        if font_size and font_size > median_size * 1.3:
            return "heading"
        if bold and font_size and font_size >= median_size and len(text.split()) <= 12:
            return "heading"
        return "paragraph"
