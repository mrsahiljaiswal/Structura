from pathlib import Path

from .schema import DocumentProfile


class DocumentUnderstandingExporter:
    FILENAME = "document.profile.json"

    def export(self, profile: DocumentProfile, output_dir: str) -> str:
        path = Path(output_dir) / self.FILENAME
        profile.save(path)
        return str(path)
