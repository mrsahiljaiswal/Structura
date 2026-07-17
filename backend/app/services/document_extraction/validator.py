from .exceptions import ExtractionError
from .schema import ExtractedDocument


class DocumentExtractionValidator:
    def validate(self, doc: ExtractedDocument) -> None:
        if doc.page_count == 0 or not doc.pages:
            raise ExtractionError("Extraction produced zero pages.")
        total_text_blocks = sum(len(p.blocks) for p in doc.pages)
        if total_text_blocks == 0:
            raise ExtractionError(
                "Extraction produced zero text blocks - the PDF may be scanned "
                "images without OCR text, or the file is corrupted."
            )
