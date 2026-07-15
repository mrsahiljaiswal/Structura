"""API v1 routes aggregation.

Combines all v1 API endpoints into a single router that can be included
in the main API router.
"""

from fastapi import APIRouter

from app.api.v1 import documents

v1_router = APIRouter()

# Include all v1 routers
v1_router.include_router(documents.router, prefix="")
