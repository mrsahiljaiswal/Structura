from app.common.exceptions import StructuraError


class UnderstandingError(StructuraError):
    """Raised when document classification fails or the LLM output is invalid."""
