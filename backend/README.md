# backend

Production-ready FastAPI backend scaffold. This repo is configured only —
no business logic has been implemented, beyond a health check.

## Stack

- **FastAPI** — ASGI web framework
- **SQLAlchemy 2** (async, via `asyncpg`) — ORM / database toolkit
- **Alembic** — schema migrations (sync driver, `psycopg2`)
- **PostgreSQL**
- **Pydantic Settings** — typed configuration from environment variables
- **Uvicorn** — ASGI server

## Getting started

### Option A: Docker Compose (recommended)

```bash
cp .env.example .env
docker compose up --build
```

The API is available at http://localhost:8000, docs at
http://localhost:8000/api/v1/docs.

### Option B: Local Python environment

Requires a running PostgreSQL instance (see `docker-compose.yml` for a
standalone `db` service: `docker compose up db`).

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt

cp .env.example .env                # adjust POSTGRES_* as needed

alembic upgrade head                 # applies migrations (none yet, but wired up)
uvicorn app.main:app --reload
```

## Scripts / commands

| Command                                    | Description                          |
| ------------------------------------------- | ------------------------------------- |
| `uvicorn app.main:app --reload`             | Run the dev server                    |
| `alembic revision --autogenerate -m "msg"`  | Generate a migration from model diffs |
| `alembic upgrade head`                      | Apply all pending migrations          |
| `alembic downgrade -1`                      | Roll back the last migration          |
| `pytest`                                    | Run tests                             |
| `ruff check .`                              | Lint                                  |
| `ruff format .`                             | Format                                |
| `mypy app`                                  | Type-check                            |

## Project structure

```
app/
  main.py            # FastAPI app factory: lifespan, CORS, router mounting
  core/
    config.py         # Settings (env vars) via pydantic-settings
    logging.py         # Centralized logging config
  api/
    deps.py             # Shared dependencies (e.g. SessionDep)
    router.py           # Aggregates all route modules
    routes/
      health.py          # GET /health, /health/ready
  db/
    base.py              # Declarative Base + naming convention
    session.py            # Async engine, session factory, get_db()
  models/                 # SQLAlchemy ORM models (empty — add per entity)
  schemas/                # Pydantic schemas (empty — add per entity)
alembic/
  env.py                  # Migration environment, wired to app settings
  versions/                # Migration files land here
tests/
  conftest.py               # Async test client fixture
  test_health.py             # Health check test
```

## Adding a new resource

1. Define the ORM model in `app/models/<name>.py`, import it in
   `app/models/__init__.py`.
2. Define Pydantic schemas in `app/schemas/<name>.py`.
3. Generate a migration: `alembic revision --autogenerate -m "add <name>"`,
   review the generated file, then `alembic upgrade head`.
4. Add a route module under `app/api/routes/<name>.py` and register it in
   `app/api/router.py`.

## Environment variables

See `.env.example`. All configuration is validated at startup via
`app/core/config.py` (Pydantic Settings) — invalid or missing required
values fail fast instead of surfacing as runtime errors.

## Health checks

- `GET /api/v1/health` — liveness, no dependencies.
- `GET /api/v1/health/ready` — readiness, verifies the database connection
  and returns `503` if it's unreachable.

## Notes

- This environment could not reach PyPI, so no virtual environment or
  installed packages are included here — only source and config. Run
  `pip install -r requirements-dev.txt` locally.
- CORS origins are read from `BACKEND_CORS_ORIGINS` (comma-separated); if
  left empty, `CORSMiddleware` is not added at all.
