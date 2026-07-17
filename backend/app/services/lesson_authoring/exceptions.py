from app.common.exceptions import StructuraError


class LessonAuthoringError(StructuraError):
    """Raised when a lesson cannot be authored from its planned learning units."""
