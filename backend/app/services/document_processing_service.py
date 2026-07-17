# DEPRECATED: This service is deprecated and will be removed in a future release.
# Use the consolidated app.services.document_extraction module instead.

from datetime import datetime
from pathlib import Path
import time

import fitz

from app.schemas.extracted_document import (
    DocumentMetadata,
    DocumentStatus,
    ExtractionMetadata,
    ExtractedDocument,
    ExtractedPage,
    ProcessingInfo,
    Statistics,
    CleanTextInfo,
    EmbeddingInfo,
)
from app.services.extracted_text_export_service import ExtractedTextExportService
from app.services.document_statistics_service import DocumentStatisticsService


class DocumentProcessingService:
    """Service for extracting text from PDF documents."""

    LIBRARY = "PyMuPDF"
    LANGUAGE_PLACEHOLDER = "en"
    MIME_TYPE = "application/pdf"

    def extract_text_from_pdf(
        self,
        file_path: Path,
        document_id: str,
        original_filename: str,
        uploaded_at: datetime,
    ) -> ExtractedDocument:
        """Extract text and build a structured extracted document object."""
        if not file_path.exists() or not file_path.is_file():
            raise FileNotFoundError(f"PDF file not found: {file_path}")

        start_time = time.perf_counter()
        pages: list[ExtractedPage] = []
        page_texts: list[str] = []

        with fitz.open(file_path) as document:
            page_count = document.page_count
            for page_number in range(page_count):
                page = document.load_page(page_number)
                text = page.get_text("text")
                page_texts.append(text)
                pages.append(
                    ExtractedPage(
                        page_number=page_number + 1,
                        text=text,
                    )
                )

        raw_text = "\n\n".join(page_texts).strip()
        extraction_time_ms = round((time.perf_counter() - start_time) * 1000)
        processed_at = datetime.utcnow()

        document_metadata = DocumentMetadata(
            id=document_id,
            filename=file_path.name,
            original_filename=original_filename,
            file_path=file_path.as_posix(),
            file_size=file_path.stat().st_size,
            mime_type=self.MIME_TYPE,
            page_count=page_count,
            character_count=len(raw_text),
            word_count=len(raw_text.split()),
            status=DocumentStatus.TEXT_EXTRACTED,
            uploaded_at=uploaded_at,
            processed_at=processed_at,
        )

        extraction_metadata = ExtractionMetadata(
            library=self.LIBRARY,
            version=getattr(fitz, "__version__", "unknown"),
            language=self.LANGUAGE_PLACEHOLDER,
            extraction_time_ms=extraction_time_ms,
        )

        statistics = DocumentStatisticsService().calculate_statistics(
            file_path=file_path,
            pages_text=page_texts,
            raw_text=raw_text,
        )

        processing_info = ProcessingInfo(
            current_stage=DocumentStatus.TEXT_EXTRACTED,
            progress=20,
            next_stage=DocumentStatus.TEXT_CLEANED,
        )

        clean_text_info = CleanTextInfo(
            status="PENDING",
            text=None,
        )

        embedding_info = EmbeddingInfo(
            status="PENDING",
            vector=None,
            model=None,
        )

        extracted_document = ExtractedDocument(
            document=document_metadata,
            extraction=extraction_metadata,
            processing=processing_info,
            statistics=statistics,
            pages=pages,
            raw_text=raw_text,
            clean_text=clean_text_info,
            chunks=[],
            embeddings=embedding_info,
        )

        ExtractedTextExportService().save_extracted_text_to_file(extracted_document)

        return extracted_document


_service_instance: DocumentProcessingService | None = None


def get_document_processing_service() -> DocumentProcessingService:
    """Get or create the global document processing service instance."""
    global _service_instance
    if _service_instance is None:
        _service_instance = DocumentProcessingService()
    return _service_instance
