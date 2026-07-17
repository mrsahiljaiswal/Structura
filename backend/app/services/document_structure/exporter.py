from pathlib import Path

from .schema import DocumentStructure


class DocumentStructureExporter:
    FILENAME = "structure.json"

    def export(self, structure: DocumentStructure, output_dir: str) -> str:
        path = Path(output_dir) / self.FILENAME
        structure.save(path)
        return str(path)
