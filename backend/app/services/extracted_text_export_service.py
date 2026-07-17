# DEPRECATED: This service is deprecated and will be removed in a future release.
# Use the consolidated app.services.course_assembly module instead.

from pathlib import Path

from app.schemas.extracted_document import ExtractedDocument


class ExtractedTextExportService:
    """Export extracted document text to structured files."""

    def save_extracted_text_to_file(self, extracted_document: ExtractedDocument) -> list[Path]:
        """Save extracted document data to JSON and text files next to the PDF.

        Args:
            extracted_document: The extracted document object.

        Returns:
            list[Path]: Paths to the written files.
        """
        source_path = Path(extracted_document.document.file_path)
        json_path = source_path.with_suffix(".extracted.json")
        text_path = source_path.with_suffix(".extracted.txt")

        json_path.write_text(
            extracted_document.model_dump_json(indent=2, exclude_none=True, by_alias=True),
            encoding="utf-8",
        )
        text_path.write_text(self._build_file_contents(extracted_document), encoding="utf-8")

        return [json_path, text_path]

    def _build_file_contents(self, extracted_document: ExtractedDocument) -> str:
        """Build the human-readable text file contents from the extracted document."""
        header = [
            f"Document ID: {extracted_document.document.id}",
            f"Filename: {extracted_document.document.filename}",
            f"Original Filename: {extracted_document.document.original_filename}",
            f"Status: {extracted_document.document.status}",
            f"Page Count: {extracted_document.document.page_count}",
            f"Character Count: {extracted_document.document.character_count}",
            f"Word Count: {extracted_document.document.word_count}",
            "",
        ]

        pages = []
        for page in extracted_document.pages:
            pages.extend([
                f"--- Page {page.page_number} ---",
                page.text,
                "",
            ])

        raw_text_section = ["--- RAW TEXT ---", "", extracted_document.raw_text]

        return "\n".join(header + pages + raw_text_section)
