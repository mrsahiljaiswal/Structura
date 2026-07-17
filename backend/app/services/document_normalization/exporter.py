from pathlib import Path

from .schema import NormalizedDocument


class DocumentNormalizationExporter:
    FILENAME = "normalized.json"

    def export(self, doc: NormalizedDocument, output_dir: str) -> str:
        path = Path(output_dir) / self.FILENAME
        doc.save(path)
        return str(path)
