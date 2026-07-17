# DEPRECATED: This service is deprecated and will be removed in a future release.
# Use the consolidated app.services.course_assembly module instead.

from pathlib import Path
import re
import fitz

from app.schemas.extracted_document import Statistics


class DocumentStatisticsService:
    """Calculate document statistics from extracted content."""

    WORDS_PER_MINUTE = 200

    def calculate_statistics(
        self,
        file_path: Path,
        pages_text: list[str],
        raw_text: str,
    ) -> Statistics:
        """Calculate document statistics from the extracted pages and PDF.

        Args:
            file_path: Path to the PDF file.
            pages_text: List of extracted page text content.
            raw_text: Merged raw text from all pages.

        Returns:
            Statistics object with computed values.
        """
        paragraphs = self._count_paragraphs(raw_text)
        headings = self._count_headings(pages_text)
        tables, images = self._count_tables_and_images(file_path)
        reading_time = self._estimate_reading_time(raw_text)

        return Statistics(
            paragraphs=paragraphs,
            headings=headings,
            tables=tables,
            images=images,
            estimated_reading_time=reading_time,
        )

    def _count_paragraphs(self, text: str) -> int:
        """Count paragraphs by splitting on double newlines or blank lines."""
        paragraphs = [
            p.strip()
            for p in re.split(r"\n\s*\n", text)
            if p.strip()
        ]
        return len(paragraphs)

    def _count_headings(self, pages_text: list[str]) -> int:
        """Estimate heading count by detecting uppercase or short lines."""
        headings = 0
        for page_text in pages_text:
            lines = page_text.split("\n")
            for line in lines:
                stripped = line.strip()
                if not stripped:
                    continue
                if self._is_likely_heading(stripped):
                    headings += 1
        return headings

    def _is_likely_heading(self, line: str) -> bool:
        """Check if a line is likely a heading."""
        if not line:
            return False
        if len(line) > 100:
            return False
        if line.isupper() and len(line) > 3:
            return True
        if line.startswith("#") or line.startswith("•"):
            return False
        if len(line.split()) <= 5 and any(c.isupper() for c in line):
            return True
        return False

    def _count_tables_and_images(self, file_path: Path) -> tuple[int, int]:
        """Count tables and images in the PDF using PyMuPDF."""
        tables = 0
        images = 0

        try:
            with fitz.open(file_path) as doc:
                for page_num in range(len(doc)):
                    page = doc[page_num]
                    blocks = page.get_text("blocks")
                    for block in blocks:
                        if len(block) >= 5 and block[4] == 1:
                            images += 1
                    image_list = page.get_images()
                    images += len(image_list)
        except Exception:
            pass

        return tables, images

    def _estimate_reading_time(self, text: str) -> int:
        """Estimate reading time in minutes based on word count."""
        word_count = len(text.split())
        minutes = max(1, word_count // self.WORDS_PER_MINUTE)
        return minutes
