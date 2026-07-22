# 🚀 Structura Backend Service

This is the production-ready FastAPI async backend service powering the Structura adaptive learning platform. It hosts the 10-stage AI document intelligence pipeline and provides API routes for courses, lesson reading, progress persistence, quizzes, and RAG chatbots.

## Tech Stack

- **FastAPI** — High-performance ASGI web framework.
- **SQLAlchemy 2.0** — Async ORM engine utilizing `asyncpg` for PostgreSQL.
- **Google Gemini SDK** — Large language model interface routing to Gemini 3.1 and 2.5 Flash Lite.
- **Alembic** — Schema database migrations.
- **Pydantic v2** — Fast type validation and serialization.

---

## Project Structure

```
backend/
  app/
    main.py                 # FastAPI application factory & routers registration
    core/
      config.py             # Settings configurations validated via Pydantic Settings
    api/
      deps.py               # Shared API dependencies (e.g. Async Session Dependency)
      router.py             # Backend routes central register
      routes/
        auth.py             # Clerk verification hooks
        courses.py          # Course generation, list, deletion, and details endpoints
        chat.py             # RAG Chatbot tutor queries with persistent histories
        health.py           # GET liveness and readiness health checks
    db/
      base.py               # Declarative SQLAlchemy Base class
      session.py            # Async engine and AsyncSession factory
    models/
      course_models.py      # SQLAlchemy Models (Document, Course, Chapter, Lesson, UserProgress)
    schemas/
      course.py             # Pydantic serialization schemas for course outputs
    services/
      document_extraction/  # Stage 1: Spatial layout text reader
      document_normalization/# Stage 2: Whitespace and characters cleaner
      document_understanding/# Stage 3: Document profiling and metadata generator
      document_structure/   # Stage 4: Heading hierarchies builder
      knowledge_extraction/ # Stage 5: Concept and prerequisite edges miner
      semantic_segmentation/# Stage 6: Learning units bundler
      educational_planner/  # Stage 7: Topological sort planner
      lesson_authoring/     # Stage 8: Textbook problem-first authoring service
      lesson_review/        # Stage 9: 9-Dimensional Critique Rubric evaluator
      course_assembly/      # Stage 10: Course graph validator & persistence assembler
    pipeline/
      orchestrator.py       # StructuraPipeline runner executing all stages sequentially
      repair_loop.py        # LessonRepairLoop managing re-authoring and auto-repair retries
    prompts/
      registry.py           # Prompts versions compile manager
      modules/              # Modules system/user prompt builders
      repair/               # Review repair feedback prompt builders
  tests/                    # Pytest backend test suite (48 unit tests)
```

---

## Setup & Running Locally

### Prerequisites
- Python 3.11+
- Running PostgreSQL Database instance

### 1. Installation
```bash
python -m venv .venv
# Windows: .venv\Scripts\activate | Unix: source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create a `.env` file inside the `backend/` directory:
```env
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/structura"
GEMINI_API_KEY="your-gemini-api-key"
CLERK_API_KEY="your-clerk-api-key"
```

### 3. Apply Migrations & Start Server
```bash
alembic upgrade head
uvicorn app.main:app --reload
```
The API docs will be available at: http://localhost:8000/docs.

---

## Running Backend Tests
Execute unit tests using the correct Python path configuration:
```bash
$env:PYTHONPATH="backend"; python -m pytest backend
```

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
