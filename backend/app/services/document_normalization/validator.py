from .exceptions import NormalizationError
from .schema import NormalizedDocument


class DocumentNormalizationValidator:
    def validate(self, doc: NormalizedDocument) -> None:
        if not doc.pages:
            raise NormalizationError("Normalization produced zero pages.")
        total_blocks = sum(len(p.blocks) for p in doc.pages)
        if total_blocks == 0:
            raise NormalizationError(
                "Normalization removed every block - header/footer detection "
                "may be too aggressive for this document."
            )
