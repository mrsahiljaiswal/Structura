from pathlib import Path

from .schema import LearningUnitSet


class SemanticSegmentationExporter:
    FILENAME = "learning_units.json"

    def export(self, unit_set: LearningUnitSet, output_dir: str) -> str:
        path = Path(output_dir) / self.FILENAME
        unit_set.save(path)
        return str(path)
