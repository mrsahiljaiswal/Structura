"""Health check endpoints.

Two checks are exposed, following common Kubernetes-style probe conventions:

- `GET /health`       liveness  — process is up, no external dependencies.
- `GET /health/ready`  readiness — process is up *and* can reach the database.

Keep this module free of business logic; it exists purely to answer
"is this service up and able to serve traffic?".
"""

import logging
from typing import Literal

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import text

from app.api.deps import SessionDep
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


class HealthStatus(BaseModel):
    status: Literal["ok"]
    environment: str


class ReadinessStatus(BaseModel):
    status: Literal["ok", "unavailable"]
    database: Literal["up", "down"]


@router.get("", response_model=HealthStatus)
async def health() -> HealthStatus:
    """Liveness probe: confirms the API process is running."""
    return HealthStatus(status="ok", environment=settings.ENVIRONMENT)


@router.get("/ready", response_model=ReadinessStatus)
async def readiness(db: SessionDep) -> JSONResponse:
    """Readiness probe: confirms the API can reach PostgreSQL."""
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        logger.exception("Readiness check failed: database unreachable")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=ReadinessStatus(status="unavailable", database="down").model_dump(),
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=ReadinessStatus(status="ok", database="up").model_dump(),
    )
