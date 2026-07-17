from .exceptions import UnderstandingError
from .schema import DocumentProfile


class DocumentUnderstandingValidator:
    MIN_CONFIDENCE = 0.3

    def validate(self, profile: DocumentProfile) -> None:
        if profile.confidence < self.MIN_CONFIDENCE:
            raise UnderstandingError(
                f"Classification confidence too low ({profile.confidence:.2f}) - "
                "manual review recommended before continuing the pipeline."
            )
