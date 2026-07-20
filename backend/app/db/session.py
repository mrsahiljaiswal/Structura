"""Async SQLAlchemy engine and session factory.

Use `get_db` as a FastAPI dependency to obtain a request-scoped
`AsyncSession`. The session is automatically closed at the end of the
request; commits/rollbacks are the caller's responsibility.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

db_uri = settings.SQLALCHEMY_DATABASE_URI
engine_kwargs = {
    "echo": settings.DB_ECHO,
}
if "sqlite" not in db_uri:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = settings.DB_POOL_SIZE
    engine_kwargs["max_overflow"] = settings.DB_MAX_OVERFLOW

engine: AsyncEngine = create_async_engine(
    db_uri,
    **engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a request-scoped DB session."""
    async with AsyncSessionLocal() as session:
        yield session
