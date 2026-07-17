class StructuraError(Exception):
    """Base exception for all Structura pipeline errors."""


class ValidationError(StructuraError):
    """Raised when a stage's output fails schema or business-rule validation."""


class StageInputError(StructuraError):
    """Raised when a stage receives malformed, missing, or incompatible input."""


class LLMError(StructuraError):
    """Raised when an LLM call fails, times out, or returns unparseable output."""
