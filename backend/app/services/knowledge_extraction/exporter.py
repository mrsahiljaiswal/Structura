from pathlib import Path

from .schema import KnowledgeGraph


class KnowledgeExtractionExporter:
    FILENAME = "knowledge.json"

    def export(self, graph: KnowledgeGraph, output_dir: str) -> str:
        path = Path(output_dir) / self.FILENAME
        graph.save(path)
        return str(path)
