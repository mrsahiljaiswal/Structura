from pathlib import Path
from typing import List

from langchain.text_splitter import RecursiveCharacterTextSplitter

from app.schemas.extracted_document import (
    ExtractedDocument,
    ChunkContent,
    DocumentStatus,
)


class ChunkService:
    """Generate semantic chunks from cleaned document text.

    Uses LangChain's RecursiveCharacterTextSplitter with configured
    chunk size and overlap. Produces structured chunk objects and
    writes `.chunked.json` and `.chunked.txt` files next to the PDF.
    """

    def __init__(self):
        # splitter configuration specified by the product
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=1200, chunk_overlap=150, length_function=len
        )

    def chunk_document(self, document: ExtractedDocument) -> ExtractedDocument:
        """Create semantic chunks from `document.clean_text.text`.

        This updates `document.chunks` and `document.processing` in-place
        and writes `.chunked.json` / `.chunked.txt` next to the original PDF.
        """
        if not document.clean_text or not document.clean_text.text:
            raise ValueError("Document has no cleaned text to chunk")

        text = document.clean_text.text

        # Split into chunks preserving order
        split_chunks: List[str] = self.splitter.split_text(text)

        # Prepare a join of original page texts to best-effort map pages
        joined_pages = "\n\n".join(p.text for p in document.pages)
        page_boundaries = []
        cumulative = 0
        for p in document.pages:
            cumulative += len(p.text or "") + 2
            page_boundaries.append(cumulative)

        # Build structured chunk objects
        chunks: List[ChunkContent] = []
        search_pos_in_text = 0
        search_pos_in_pages = 0

        for idx, chunk_text in enumerate(split_chunks, start=1):
            # Find chunk position in cleaned text (handle repeated content)
            start_idx = text.find(chunk_text, search_pos_in_text)
            if start_idx == -1:
                # Fallback: try a wider search from beginning
                start_idx = text.find(chunk_text)
            end_idx = start_idx + len(chunk_text) if start_idx != -1 else -1
            if start_idx != -1:
                search_pos_in_text = end_idx

            # Best-effort page mapping by searching in the joined pages
            page_start = 1
            page_end = document.document.page_count or 1
            page_found_idx = joined_pages.find(chunk_text, search_pos_in_pages)
            if page_found_idx != -1:
                # map character index to page numbers using page_boundaries
                # find first page where boundary > index
                char_idx = page_found_idx
                for i, boundary in enumerate(page_boundaries):
                    if char_idx < boundary:
                        page_start = i + 1
                        break
                # estimate end page
                end_char = page_found_idx + len(chunk_text)
                for j, boundary in enumerate(page_boundaries):
                    if end_char <= boundary:
                        page_end = j + 1
                        break
                search_pos_in_pages = page_found_idx + len(chunk_text)
            else:
                # fallback proportional mapping based on cleaned text position
                if start_idx != -1 and len(text) > 0:
                    frac_start = start_idx / len(text)
                    frac_end = (end_idx if end_idx > 0 else start_idx) / len(text)
                    page_count = max(1, document.document.page_count or 1)
                    page_start = int(frac_start * page_count) + 1
                    page_end = int(frac_end * page_count) + 1

            chunk_obj = ChunkContent(
                chunk_id=f"chunk_{idx:04d}",
                chunk_index=idx,
                page_start=page_start,
                page_end=page_end,
                character_count=len(chunk_text),
                text=chunk_text,
                embedding_status="PENDING",
                course_status="PENDING",
            )

            chunks.append(chunk_obj)

        # Assign chunks and update processing metadata
        document.chunks = chunks
        document.processing.current_stage = DocumentStatus.CHUNKED
        document.processing.progress = 60
        document.processing.next_stage = DocumentStatus.COURSE_GENERATED
        document.document.status = DocumentStatus.CHUNKED

        # Export chunked JSON and a human-readable chunked text file
        source_path = Path(document.document.file_path)
        chunked_json_path = source_path.with_suffix(".chunked.json")
        chunked_txt_path = source_path.with_suffix(".chunked.txt")

        chunked_json_path.write_text(
            document.model_dump_json(indent=2, exclude_none=True, by_alias=True),
            encoding="utf-8",
        )

        # Build readable chunk file
        lines = []
        lines.append("=" * 25)
        lines.append("CHUNKED DOCUMENT TEXT")
        lines.append("=" * 25)
        lines.append("")
        for i, c in enumerate(chunks, start=1):
            lines.append("=" * 25)
            lines.append(f"CHUNK {i}")
            lines.append("=" * 25)
            lines.append("")
            lines.append(c.text)
            lines.append("")

        chunked_txt_path.write_text("\n".join(lines), encoding="utf-8")

        return document


def get_chunk_service() -> ChunkService:
    return ChunkService()
