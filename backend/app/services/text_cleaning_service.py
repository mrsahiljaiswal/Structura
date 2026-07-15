"""
Text Cleaning Service

Preprocesses extracted document text for AI processing.
Every production RAG system has a preprocessing layer to improve LLM performance.

Responsibilities:
1. Normalize whitespace (collapse multiple blanks)
2. Remove trailing spaces
3. Normalize bullets (standardize to •)
4. Normalize Unicode (smart quotes, long dashes, tabs)
5. Preserve headings
6. Merge broken lines intelligently
7. Remove repeated page headers
8. Remove standalone page numbers
"""

import re
import time
from typing import Set
from pathlib import Path
from app.schemas.extracted_document import (
    ExtractedDocument,
    DocumentStatus,
    CleanTextInfo,
)



class TextCleaningService:
    """Service for cleaning extracted text for AI processing."""

    def __init__(self):
        self.repeated_lines: Set[str] = set()

    def clean_document(self, document: ExtractedDocument) -> ExtractedDocument:
        """
        Clean the document's raw text and update the extraction object.

        Args:
            document: ExtractedDocument with raw text to clean

        Returns:
            Updated ExtractedDocument with cleaned text and updated processing info
        """
        start_time = time.time()

        # Process the raw text through all cleaning operations
        cleaned_text = document.raw_text

        # 1. Normalize whitespace (collapse multiple blank lines)
        cleaned_text = self._normalize_whitespace(cleaned_text)

        # 2. Remove trailing spaces from each line
        cleaned_text = self._remove_trailing_spaces(cleaned_text)

        # 3. Normalize bullets
        cleaned_text = self._normalize_bullets(cleaned_text)

        # 4. Normalize Unicode characters
        cleaned_text = self._normalize_unicode(cleaned_text)

        # 5. Merge broken lines intelligently (must come after whitespace normalization)
        cleaned_text = self._merge_broken_lines(cleaned_text)

        # 6. Remove repeated page headers
        cleaned_text = self._remove_repeated_headers(cleaned_text)

        # 7. Remove standalone page numbers
        cleaned_text = self._remove_page_numbers(cleaned_text)

        # Calculate statistics for cleaned text
        character_count = len(cleaned_text)
        word_count = len(cleaned_text.split())
        cleaning_time_ms = int((time.time() - start_time) * 1000)

        # Update the document's clean_text field
        document.clean_text = CleanTextInfo(
            status="COMPLETED",
            text=cleaned_text,
            character_count=character_count,
            word_count=word_count,
            cleaning_time_ms=cleaning_time_ms,
        )

        # Update document metadata and processing information
        document.document.status = DocumentStatus.TEXT_CLEANED
        document.processing.current_stage = DocumentStatus.TEXT_CLEANED
        document.processing.progress = 40
        document.processing.next_stage = DocumentStatus.CHUNKED

        # Export cleaned document to files

        source_path = Path(document.document.file_path)
        cleaned_json_path = source_path.with_suffix(".cleaned.json")
        cleaned_text_path = source_path.with_suffix(".cleaned.txt")
        
        # Write cleaned JSON file
        cleaned_json_path.write_text(
            document.model_dump_json(indent=2, exclude_none=True, by_alias=True),
            encoding="utf-8",
        )
        
        # Write cleaned text file with human-readable format
        cleaned_text_content = self._build_cleaned_text_file(document)
        cleaned_text_path.write_text(cleaned_text_content, encoding="utf-8")

        return document


    def _build_cleaned_text_file(self, document: ExtractedDocument) -> str:
        """Build human-readable cleaned text file content."""
        lines = []
        lines.append("=" * 80)
        lines.append("CLEANED DOCUMENT TEXT")
        lines.append("=" * 80)
        lines.append("")
        lines.append(f"Document: {document.document.original_filename}")
        lines.append(f"Status: {document.processing.current_stage}")
        lines.append(f"Cleaned at: {document.document.processed_at}")
        lines.append(f"Cleaning time: {document.clean_text.cleaning_time_ms}ms")
        lines.append(f"Characters: {document.clean_text.character_count}")
        lines.append(f"Words: {document.clean_text.word_count}")
        lines.append("")
        lines.append("=" * 80)
        lines.append("CLEANED TEXT")
        lines.append("=" * 80)
        lines.append("")
        lines.append(document.clean_text.text)
        lines.append("")
        lines.append("=" * 80)
        return "\n".join(lines)

    def _normalize_whitespace(self, text: str) -> str:
        """
        Normalize whitespace by collapsing multiple blank lines into one.

        Convert:
            Hello


            World
        Into:
            Hello

            World
        """
        # Replace multiple blank lines with a single blank line
        text = re.sub(r"\n\s*\n\s*\n+", "\n\n", text)
        # Handle case of more than 2 consecutive newlines
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text

    def _remove_trailing_spaces(self, text: str) -> str:
        """Remove trailing whitespace from each line."""
        lines = text.split("\n")
        lines = [line.rstrip() for line in lines]
        return "\n".join(lines)

    def _normalize_bullets(self, text: str) -> str:
        """
        Normalize all bullet styles to standard bullet point (•).

        Convert:
            - item
            * item
            ○ item
            ▪ item
        Into:
            • item
        """
        # Normalize common bullet formats at line start
        text = re.sub(r"^\s*[-*○▪]\s+", "• ", text, flags=re.MULTILINE)
        # Also handle bullets after some spaces
        text = re.sub(r"(\n\s+)[-*○▪]\s+", r"\1• ", text)
        return text

    def _normalize_unicode(self, text: str) -> str:
        """
        Normalize Unicode characters for compatibility.

        Convert:
            - Smart quotes (" ") to regular quotes (" ")
            - Long dashes (—) to regular dashes (-)
            - Tabs to spaces
            - Other special characters
        """
        # Smart quotes to regular quotes
        text = text.replace("\u201c", '"')  # Left double quote
        text = text.replace("\u201d", '"')  # Right double quote
        text = text.replace("\u2018", "'")  # Left single quote
        text = text.replace("\u2019", "'")  # Right single quote

        # Long dashes to regular dashes
        text = text.replace("\u2014", "-")  # Em dash
        text = text.replace("\u2013", "-")  # En dash

        # Tabs to spaces
        text = text.replace("\t", "    ")

        # Other common special characters
        text = text.replace("\u2022", "•")  # Bullet point (keep as is but normalize)
        text = text.replace("\u2026", "...")  # Ellipsis
        text = text.replace("\u00a0", " ")  # Non-breaking space

        return text

    def _merge_broken_lines(self, text: str) -> str:
        """
        Merge broken lines intelligently.

        PDFs often produce:
            Machine generated
            data
        This should merge to:
            Machine generated data

        Only merge if:
        - Line doesn't end with punctuation (., !, ?, :, ;, ,)
        - Next line doesn't start with uppercase (likely new sentence)
        - Next line isn't a bullet point
        - Next line isn't a heading
        """
        lines = text.split("\n")
        merged_lines = []

        i = 0
        while i < len(lines):
            current = lines[i].strip()

            # Skip empty lines
            if not current:
                merged_lines.append("")
                i += 1
                continue

            # Check if we should merge with next line
            should_merge = (
                i + 1 < len(lines)
                and current
                and not current.endswith((".", "!", "?", ":", ";", ","))
                and not self._is_heading(current)
                and lines[i + 1].strip()
                and not lines[i + 1].strip().startswith(("•", "-", "*", "○", "▪"))
                and not lines[i + 1].strip()[0].isupper()
            )

            if should_merge:
                # Merge with next line(s)
                merged = current
                j = i + 1
                while j < len(lines):
                    next_line = lines[j].strip()
                    if not next_line:
                        break
                    if self._is_heading(next_line):
                        break
                    if next_line.startswith(("•", "-", "*", "○", "▪")):
                        break
                    if next_line[0].isupper() and merged.endswith((".", "!", "?")):
                        break
                    merged += " " + next_line
                    if next_line.endswith((".", "!", "?", ":", ";", ",")):
                        j += 1
                        break
                    j += 1

                merged_lines.append(merged)
                i = j
            else:
                merged_lines.append(current)
                i += 1

        return "\n".join(merged_lines)

    def _is_heading(self, line: str) -> bool:
        """Check if a line appears to be a heading."""
        if not line:
            return False
        # Heuristics for headings:
        # 1. All uppercase and short
        # 2. Ends with nothing (not a regular sentence)
        line_stripped = line.strip()
        if len(line_stripped) > 100:
            return False
        # All caps or mostly caps with some special formatting
        is_all_caps = line_stripped.isupper()
        has_number = any(c.isdigit() for c in line_stripped)
        looks_like_heading = is_all_caps or (has_number and len(line_stripped) < 50)
        return looks_like_heading

    def _remove_repeated_headers(self, text: str) -> str:
        """
        Remove repeated page headers.

        Example:
            Data Analytics
            Page 1
            ...
            Data Analytics
            Page 2
        Becomes:
            Data Analytics
            ...
        """
        lines = text.split("\n")
        filtered_lines = []
        line_counts = {}

        for line in lines:
            stripped = line.strip()

            # Skip page indicators at line end (e.g., " Page 1", " 1", " Page 1")
            if re.match(r"^(Page\s*\d+|\d+)$", stripped, re.IGNORECASE):
                continue

            # Track line occurrences to detect repeated headers
            if stripped:
                if stripped in line_counts:
                    line_counts[stripped] += 1
                else:
                    line_counts[stripped] = 1

            # If this line appears too many times (likely a repeated header), skip it
            # But allow the first occurrence and maybe the second
            if stripped and line_counts[stripped] > 3:
                continue

            filtered_lines.append(line)

        return "\n".join(filtered_lines)

    def _remove_page_numbers(self, text: str) -> str:
        """
        Remove standalone page numbers.

        Remove lines that are just page numbers (1, 2, 3, etc.)
        or page indicators (Page 1, Page 2, etc.)
        """
        lines = text.split("\n")
        filtered_lines = []

        for line in lines:
            stripped = line.strip()

            # Check if line is a standalone page number or page indicator
            if re.match(r"^(Page\s*\d+|\d+)$", stripped, re.IGNORECASE):
                continue

            # Also remove lines that are JUST numbers with optional dashes/periods
            if re.match(r"^[\d\-\.]+$", stripped):
                continue

            filtered_lines.append(line)

        return "\n".join(filtered_lines)


def get_text_cleaning_service() -> TextCleaningService:
    """Factory function to get text cleaning service instance."""
    return TextCleaningService()
