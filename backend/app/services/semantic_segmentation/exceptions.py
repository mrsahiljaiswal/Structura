from app.common.exceptions import StructuraError


class SegmentationError(StructuraError):
    """Raised when learning units cannot be built from the knowledge graph and structure."""
