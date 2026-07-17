from app.common.exceptions import StructuraError


class KnowledgeExtractionError(StructuraError):
    """Raised when concept extraction fails for a section or produces invalid output."""
