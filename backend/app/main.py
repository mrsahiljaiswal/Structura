"""FastAPI application entrypoint.

Run locally with:

    uvicorn app.main:app --reload

This module only wires together configuration, logging, middleware, and
routers — no business logic belongs here.
"""

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.logging import setup_logging

logger = logging.getLogger(__name__)


from sqlalchemy import text
from app.db.session import engine

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    setup_logging()
    logger.info(
        "Starting %s [environment=%s, debug=%s]",
        settings.PROJECT_NAME,
        settings.ENVIRONMENT,
        settings.DEBUG,
    )

    # Auto-ensure database schema columns exist
    try:
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS streak_count INTEGER NOT NULL DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS streak_last_date VARCHAR(64);"))
            await conn.execute(text("ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS chat_history JSONB NOT NULL DEFAULT '[]'::jsonb;"))
            await conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);"))
            logger.info("PostgreSQL schema columns verified and updated.")
    except Exception as e:
        logger.warning("Database schema check notice: %s", e)

    yield
    logger.info("Shutting down %s", settings.PROJECT_NAME)


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
        docs_url=f"{settings.API_V1_PREFIX}/docs",
        redoc_url=f"{settings.API_V1_PREFIX}/redoc",
        lifespan=lifespan,
    )

    cors_origins = [str(origin).rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS]
    if cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    else:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=False,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    return app


app = create_app()
