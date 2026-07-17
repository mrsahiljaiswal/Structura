from .exceptions import SegmentationError
from .schema import LearningUnitSet


class SemanticSegmentationValidator:
    def validate(self, unit_set: LearningUnitSet) -> None:
        if not unit_set.units:
            raise SegmentationError("Segmentation produced zero learning units.")
        empty_text_units = [u.id for u in unit_set.units if not u.text.strip()]
        if empty_text_units:
            raise SegmentationError(
                f"Learning units with no source text found: {empty_text_units}"
            )
