"""Alembic migration environment.

Uses the app's own Settings (app.core.config) for the database URL instead
of hardcoding it in alembic.ini, and app.db.base.Base.metadata as the
autogenerate target. Migrations run with a plain sync driver (psycopg2)
for simplicity/reliability, independent of the app's async runtime driver.

Import every model module in app/models/__init__.py so autogenerate can see
all tables.
"""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.core.config import settings
from app.db.base import Base

# Ensure all models are registered on Base.metadata before autogenerate runs.
import app.models  # noqa: F401  isort:skip

# Alembic Config object, providing access to values within alembic.ini.
config = context.config

# Inject the database URL from app settings rather than alembic.ini,
# keeping credentials out of version control.
config.set_main_option("sqlalchemy.url", settings.SQLALCHEMY_DATABASE_URI_SYNC)

# Interpret the config file for Python logging, unless run in a context
# (e.g. pytest) that has already configured logging itself.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Autogenerate support: point Alembic at the app's metadata.
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations without a live DB connection, emitting SQL to stdout."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations against a live DB connection."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
