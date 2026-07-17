from app.common.exceptions import StructuraError


class PlanningError(StructuraError):
    """Raised when a course plan cannot be built or ordered from the learning units."""
