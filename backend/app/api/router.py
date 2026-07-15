"""Top-level API router: aggregates all versioned route modules.

Add new route modules to `app/api/routes/` and wire them in here. This is
the single place `app.main` needs to import to mount the whole API.
"""

from fastapi import APIRouter

from app.api.routes import health
from app.api.v1 import v1_router

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(v1_router)
