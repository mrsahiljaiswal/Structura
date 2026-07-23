from __future__ import annotations
import logging
from pathlib import Path
from typing import List

from app.services.document_normalization.schema import NormalizedDocument, NormalizedPage
from .schema import SynthesizedDocument, SourceFileSummary

logger = logging.getLogger(__name__)


class CrossDocumentSynthesisService:
    """
    Module 3 (Stage 3): Cross-Document Synthesis Engine.

    Combines normalized documents from multiple source files into a unified
    multi-source document structure while preserving individual file provenance,
    page offsets, and source file metadata.
    """

    def synthesize(
        self,
        normalized_docs: List[NormalizedDocument],
        course_title: str = "Multi-Document Course",
    ) -> SynthesizedDocument:
        if not normalized_docs:
            raise ValueError("Cannot perform cross-document synthesis on zero documents.")

        logger.info(
            "Performing Cross-Document Synthesis on %d documents for title: '%s'",
            len(normalized_docs),
            course_title,
        )

        source_summaries: List[SourceFileSummary] = []
        combined_pages: List[NormalizedPage] = []
        global_page_counter = 1

        for doc_index, norm_doc in enumerate(normalized_docs, start=1):
            filename = Path(norm_doc.source_path).name
            file_ext = Path(norm_doc.source_path).suffix.lower().lstrip(".")
            doc_id = f"doc_{doc_index}_{filename}"

            source_summaries.append(
                SourceFileSummary(
                    document_id=doc_id,
                    filename=filename,
                    file_type=file_ext,
                    page_count=norm_doc.page_count,
                )
            )

            for page in norm_doc.pages:
                # Re-index page with global order while preserving page details
                new_page = NormalizedPage(
                    page_number=global_page_counter,
                    blocks=page.blocks,
                    tables=page.tables,
                )
                combined_pages.append(new_page)
                global_page_counter += 1

        combined_doc = NormalizedDocument(
            source_path="multi_source_synthesized",
            page_count=len(combined_pages),
            pages=combined_pages,
            removed_headers=[],
            removed_footers=[],
        )

        return SynthesizedDocument(
            course_title=course_title,
            source_files=source_summaries,
            normalized_document=combined_doc,
        )
