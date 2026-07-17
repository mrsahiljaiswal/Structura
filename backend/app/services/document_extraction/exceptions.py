from app.common.exceptions import StructuraError


class ExtractionError(StructuraError):
    """Raised when a PDF cannot be opened, read, or parsed."""
