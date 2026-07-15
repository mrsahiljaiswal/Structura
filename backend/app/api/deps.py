"""Shared FastAPI dependencies, importable across all route modules."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db

# Usage: `async def endpoint(db: SessionDep): ...`
SessionDep = Annotated[AsyncSession, Depends(get_db)]
