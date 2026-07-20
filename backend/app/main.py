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
    logging.getLogger("pdfminer").setLevel(logging.WARNING)
    logging.getLogger("pdfminer.psparser").setLevel(logging.WARNING)
    logging.getLogger("pdfminer.pdfinterp").setLevel(logging.WARNING)
    logging.getLogger("pdfplumber").setLevel(logging.WARNING)
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


from fastapi.responses import JSONResponse

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
        docs_url=f"{settings.API_V1_PREFIX}/docs",
        redoc_url=f"{settings.API_V1_PREFIX}/redoc",
        lifespan=lifespan,
    )

    cors_origins = [
        "https://structura-psi.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        logger.error(f"Global unhandled error on {request.url.path}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc) or "An internal server error occurred."},
        )

    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    return app


app = create_app()
