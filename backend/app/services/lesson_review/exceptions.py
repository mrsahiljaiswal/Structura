from app.common.exceptions import StructuraError


class ReviewError(StructuraError):
    """Raised when a lesson cannot be reviewed or the reviewer's output is invalid."""
