from app.common.exceptions import StructuraError


class AssemblyError(StructuraError):
    """Raised when the final course cannot be assembled or persisted."""
