from app.common.exceptions import StructuraError


class StructureError(StructuraError):
    """Raised when a hierarchy cannot be built from the normalized document."""
