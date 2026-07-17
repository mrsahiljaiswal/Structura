from pathlib import Path

from .schema import ExtractedDocument


class DocumentExtractionExporter:
    FILENAME = "document.extracted.json"

    def export(self, doc: ExtractedDocument, output_dir: str) -> str:
        path = Path(output_dir) / self.FILENAME
        doc.save(path)
        return str(path)
