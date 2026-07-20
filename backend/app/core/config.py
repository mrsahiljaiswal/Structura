"""Application configuration.

Settings are loaded from environment variables (and a local `.env` file in
development) via pydantic-settings. Import `settings` anywhere it's needed
instead of reading `os.environ` directly, so configuration stays typed,
validated, and centralized.
"""

from typing import Annotated, Any, Literal

from dotenv import load_dotenv
# Load environment variables from .env file into os.environ
load_dotenv()

from pydantic import AnyUrl, BeforeValidator, PostgresDsn, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _parse_cors(value: Any) -> list[str] | Any:
    """Allow BACKEND_CORS_ORIGINS to be supplied as a comma-separated string
    (e.g. `http://localhost:3000,https://example.com`) or a JSON list."""
    if isinstance(value, str) and not value.startswith("["):
        return [origin.strip() for origin in value.split(",") if origin.strip()]
    return value


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- General -----------------------------------------------------
    PROJECT_NAME: str = "FastAPI Backend"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: Literal["local", "staging", "production"] = "local"
    DEBUG: bool = False

    # --- Logging -------------------------------------------------------
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    LOG_JSON: bool = False

    # --- CORS ------------------------------------------------------------
    # Comma-separated list of allowed origins, e.g.:
    # BACKEND_CORS_ORIGINS=http://localhost:3000,https://app.example.com
    BACKEND_CORS_ORIGINS: Annotated[list[AnyUrl] | list[str], BeforeValidator(_parse_cors)] = []

    # --- Database (PostgreSQL) -------------------------------------------
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    DATABASE_URL: str | None = None

    # Pool tuning; sane defaults for a small production deployment.
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_ECHO: bool = False

    @computed_field  # type: ignore[prop-decorator]
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        """Async SQLAlchemy connection string (uses the asyncpg driver)."""
        if self.DATABASE_URL:
            db_url = self.DATABASE_URL.strip()
            if db_url.startswith("postgres://"):
                return db_url.replace("postgres://", "postgresql+asyncpg://", 1)
            elif db_url.startswith("postgresql://"):
                return db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
            return db_url
        return str(
            PostgresDsn.build(
                scheme="postgresql+asyncpg",
                username=self.POSTGRES_USER,
                password=self.POSTGRES_PASSWORD,
                host=self.POSTGRES_SERVER,
                port=self.POSTGRES_PORT,
                path=self.POSTGRES_DB,
            )
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def SQLALCHEMY_DATABASE_URI_SYNC(self) -> str:
        """Sync connection string, used by Alembic and synchronous tasks."""
        if self.DATABASE_URL:
            db_url = self.DATABASE_URL.strip()
            if db_url.startswith("postgres://"):
                return db_url.replace("postgres://", "postgresql+psycopg2://", 1)
            elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
                return db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
            return db_url
        return str(
            PostgresDsn.build(
                scheme="postgresql+psycopg2",
                username=self.POSTGRES_USER,
                password=self.POSTGRES_PASSWORD,
                host=self.POSTGRES_SERVER,
                port=self.POSTGRES_PORT,
                path=self.POSTGRES_DB,
            )
        )


settings = Settings()
