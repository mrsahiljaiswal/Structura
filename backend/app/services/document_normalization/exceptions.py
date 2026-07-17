from app.common.exceptions import StructuraError


class NormalizationError(StructuraError):
    """Raised when normalization receives an empty or malformed extracted document."""
