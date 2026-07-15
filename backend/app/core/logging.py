"""Centralized logging configuration.

Call `setup_logging()` once, at application startup (see app/main.py's
lifespan handler). Uses stdlib `logging.config.dictConfig` so behavior is
easy to reason about and easy to swap (e.g. plain text locally, JSON in
production) without touching call sites elsewhere in the app.
"""

import logging
import logging.config
from typing import Any

from app.core.config import settings

_TEXT_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
_JSON_FORMAT = (
    '{"time": "%(asctime)s", "level": "%(levelname)s", '
    '"logger": "%(name)s", "message": "%(message)s"}'
)


def _build_logging_config() -> dict[str, Any]:
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": _JSON_FORMAT if settings.LOG_JSON else _TEXT_FORMAT,
                "datefmt": "%Y-%m-%dT%H:%M:%S%z",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "default",
                "stream": "ext://sys.stdout",
            },
        },
        "root": {
            "handlers": ["console"],
            "level": settings.LOG_LEVEL,
        },
        "loggers": {
            "uvicorn": {"level": settings.LOG_LEVEL, "propagate": True},
            "uvicorn.error": {"level": settings.LOG_LEVEL, "propagate": True},
            # Access logs are high-volume; keep at INFO unless debugging.
            "uvicorn.access": {"level": settings.LOG_LEVEL, "propagate": True},
            "sqlalchemy.engine": {
                "level": "INFO" if settings.DB_ECHO else "WARNING",
                "propagate": True,
            },
        },
    }


def setup_logging() -> None:
    logging.config.dictConfig(_build_logging_config())
