<div align="center">

# 🧠 Structura
### AI-Powered Document-to-Course Learning Platform

**Transform any PDF textbook or research paper into a fully structured, interactive learning course — powered by a 10-stage multi-agent AI pipeline.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-structura--psi.vercel.app-6366f1?style=for-the-badge&logo=vercel)](https://structura-psi.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-mrsahiljaiswal%2FStructura-181717?style=for-the-badge&logo=github)](https://github.com/mrsahiljaiswal/Structura)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React.js%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql)](https://postgresql.org)

</div>

---

<!-- ============================================================ -->
<!--  BANNER SCREENSHOT                                           -->
<!--  Replace the block below with your actual banner image      -->
<!-- ============================================================ -->

> 📸 **[SCREENSHOT — Dashboard / Hero Banner]**
> _Suggested: Full-width screenshot of the Structura dashboard homepage_

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Screenshots](#-screenshots)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [The 10-Stage AI Pipeline](#-the-10-stage-ai-pipeline)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Local Setup & Installation](#-local-setup--installation)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Deployment Guide](#-deployment-guide)
- [License](#-license)

---

## 🧩 Overview

Structura solves a real academic problem: learners are buried under unstructured PDFs, research papers, and dense textbooks with no clear path to understanding them.

Structura ingests any PDF and runs it through a **10-stage multi-agent AI pipeline** — extracting knowledge, planning a curriculum, authoring lessons, running automated quality reviews, and assembling a complete structured course. The result is a university-style interactive learning experience complete with an AI Tutor, adaptive quizzes, concept maps, and study analytics — all generated from a single document upload.

---

## 🌐 Live Demo

| Service | URL |
|---|---|
| 🖥️ Frontend (Vercel) | [structura-psi.vercel.app](https://structura-psi.vercel.app) |
| ⚙️ Backend API (Render) | Render Web Service (FastAPI) |
| 🗄️ Database | PostgreSQL 18 on Render (Singapore) |

---

## 📸 Screenshots

<!-- ============================================================ -->
<!--  SCREENSHOTS SECTION                                         -->
<!--  Add your screenshots between the comment blocks below      -->
<!-- ============================================================ -->

### Upload Page
> 📸 **[SCREENSHOT — Upload Page]**
> _Drag-and-drop PDF upload interface with processing status_

---

### Generated Course — Chapter View
> 📸 **[SCREENSHOT — Course Detail / Chapter Outline]**
> _Auto-generated course with chapters, lessons, and progress indicators_

---

### Lesson Reader
> 📸 **[SCREENSHOT — Lesson Reader]**
> _Structured lesson with content, key takeaways, and worked examples_

---

### AI Tutor — RAG Chat
> 📸 **[SCREENSHOT — AI Tutor Chat Interface]**
> _Course-grounded conversational AI tutor answering document-specific questions_

---

### Practice Quiz
> 📸 **[SCREENSHOT — Quiz Generator]**
> _AI-generated adaptive quiz with multiple choice, true/false questions_

---

### Analytics Dashboard
> 📸 **[SCREENSHOT — Analytics Page]**
> _Study time tracking, lesson completion stats, and weekly activity heatmap_

---

## ✨ Key Features

### 🔬 10-Stage Multi-Agent AI Pipeline
A fully automated document intelligence pipeline that converts raw PDFs into structured courses. Every stage produces a validated artifact before passing to the next module — ensuring quality throughout generation.

### 🔁 Auto-Corrective Repair Loop
Lessons failing automated quality review are automatically fed back to the LLM for self-correction (up to 2 retries). A **9-Dimensional Critique Rubric** evaluates grounding accuracy, pedagogical clarity, concept completeness, factual consistency, and more.

### 🤖 Dual-Provider LLM Routing with Fallback
- **Priority 1 — Google Gemini**: Used for the full document processing pipeline and AI Tutor chat.
- **Priority 2 — Groq (LLaMA 3)**: Automatic fallback if Gemini is rate-limited or unavailable.
- Both providers include retry logic, rate-limit handling, and JSON self-correction.

### 📚 RAG-Powered AI Tutor Suite
Three distinct AI-powered study modes — all grounded strictly in the generated course content:
- **RAG Chat**: Conversational Q&A with persistent dialogue history.
- **Socratic Explainer**: Multi-depth concept explanations (ELI5, Analogy, Deep Academic, Misconceptions).
- **Practice Quiz Generator**: Adaptive quiz generation (Multiple Choice, True/False, Mixed, Short Answer).

### 📊 Study Analytics & Streak Tracking
- Automatically tracks lesson reading time, quiz scores, and AI Tutor session time.
- Persists daily study streaks, per-day study heatmaps, and cumulative progress.

### 🗺️ Concept Mind Maps
- SVG-based concept flowcharts connecting the knowledge hub to chapters and lesson branches.
- Fully interactive, visually displaying the course knowledge graph.

### 🔐 User Authentication
- Clerk-powered authentication with protected dashboard routes.
- Per-user course isolation — each user sees only their own generated courses.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     React.js SPA (Vite)                         │
│   React Router v7 • Clerk Auth • TanStack Query • Lucide Icons  │
└───────────────────────────────┬─────────────────────────────────┘
                                │  HTTP REST / JSON
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Async Backend                         │
│      Python 3.12 • SQLAlchemy 2.0 (asyncpg) • Pydantic v2      │
│                   Starlette CORS Middleware                      │
└──────────────────┬────────────────────────┬─────────────────────┘
                   │                        │
       ┌───────────▼──────────┐  ┌──────────▼──────────────┐
       │   PostgreSQL DB       │  │    LLM Routing Layer     │
       │  Render Cloud (SG)   │  │  Gemini → Groq Fallback  │
       │  5 Tables, JSONB      │  │  JSON Repair + Retry     │
       └──────────────────────┘  └──────────────────────────┘
```

---

## 🔬 The 10-Stage AI Pipeline

Each stage runs sequentially. Every stage validates its output before passing it to the next module.

```
PDF File
   │
   ▼
┌─────────────────────────────────────────┐
│  Stage 1 │ Document Extraction          │  PyPDF / PDFPlumber → raw text blocks
│  Stage 2 │ Document Normalization       │  Clean whitespace, fix encoding
│  Stage 3 │ Document Understanding       │  LLM → classify type, extract metadata
│  Stage 4 │ Document Structure Analysis  │  Build section/subsection hierarchy
│  Stage 5 │ Knowledge Extraction         │  LLM → concepts, definitions, prereqs
│  Stage 6 │ Semantic Segmentation        │  Group concepts into learning units
│  Stage 7 │ Educational Planning         │  LLM → topological curriculum plan
│  Stage 8 │ Lesson Authoring             │  LLM → write structured Markdown lessons
│  Stage 9 │ Educational Review           │  LLM → 9-dim rubric score + repair loop
│  Stage 10│ Course Assembly              │  Validate + persist to PostgreSQL
└─────────────────────────────────────────┘
   │
   ▼
Structured Course (Chapters → Lessons → Content)
```

> **Multi-Document Mode**: Stages 1–2 run per-file, then a Cross-Document Synthesis module merges and deduplicates before continuing from Stage 3.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React.js 19 + Vite | SPA framework & build tool |
| React Router v7 | Client-side routing |
| Clerk React | User authentication & session management |
| TanStack Query v5 | Async server state, caching, refetching |
| Lucide Icons | Icon library |
| Vanilla CSS | Styling with custom design tokens |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | Async REST API framework |
| Python 3.12 | Runtime |
| SQLAlchemy 2.0 (asyncpg) | Async ORM + PostgreSQL driver |
| Pydantic v2 | Data validation & schema enforcement |
| Alembic | Database migrations |
| PyPDF / PDFPlumber | PDF text extraction |
| `requests` | HTTP client for LLM API calls |

### AI & LLM
| Technology | Purpose |
|---|---|
| Google Gemini (Flash Lite) | Document pipeline + AI Tutor |
| Groq (LLaMA 3.3 70B) | Fallback LLM provider |
| Custom LLMClient | Multi-provider routing, retry, JSON repair |

### Infrastructure
| Service | Purpose |
|---|---|
| Vercel | Frontend hosting (CDN + edge) |
| Render | FastAPI backend hosting |
| Render PostgreSQL 18 | Cloud database (Singapore) |
| Clerk | Auth infrastructure |

---

## 📁 Project Structure

```
Structura/
├── frontend/                        # React.js SPA (Vite)
│   ├── index.html                   # Vite HTML entry point
│   ├── vite.config.ts               # Vite + path alias config
│   ├── src/
│   │   ├── main.tsx                 # React app entry (ClerkProvider + QueryClient)
│   │   ├── App.tsx                  # React Router routes + protected route guards
│   │   ├── globals.css              # Global CSS design tokens
│   │   ├── pages/                   # Page-level components
│   │   │   ├── landing.tsx
│   │   │   ├── sign-in.tsx
│   │   │   ├── sign-up.tsx
│   │   │   └── dashboard/
│   │   │       ├── index.tsx        # Main dashboard
│   │   │       ├── courses.tsx      # Course catalog
│   │   │       ├── course-detail.tsx
│   │   │       ├── lesson-detail.tsx
│   │   │       ├── tutor.tsx        # AI Tutor suite
│   │   │       ├── upload.tsx       # PDF upload
│   │   │       ├── analytics.tsx
│   │   │       └── settings.tsx
│   │   ├── components/              # Reusable UI components
│   │   ├── hooks/                   # Custom React hooks
│   │   └── lib/                     # API client, config, utilities
│
├── backend/                         # FastAPI Python backend
│   ├── app/
│   │   ├── main.py                  # FastAPI app factory + lifespan
│   │   ├── core/config.py           # Pydantic settings (env vars)
│   │   ├── api/v1/                  # REST API route handlers
│   │   │   ├── documents.py         # POST /upload
│   │   │   ├── courses.py           # GET/DELETE /courses
│   │   │   ├── lessons.py           # GET/PATCH /lessons
│   │   │   ├── chat.py              # POST /chat (AI Tutor)
│   │   │   └── user.py              # GET /user/progress
│   │   ├── pipeline/
│   │   │   ├── orchestrator.py      # 10-stage pipeline runner
│   │   │   └── repair_loop.py       # Lesson authoring + review repair
│   │   ├── services/                # One service per pipeline stage
│   │   ├── models/course_models.py  # SQLAlchemy ORM models
│   │   ├── common/llm_client.py     # Multi-provider LLM client
│   │   └── prompts/                 # Modular versioned prompt library
│   ├── alembic/                     # DB migration scripts
│   └── requirements.txt
│
└── README.md
```

---

## ⚡ Local Setup & Installation

### Prerequisites
- Node.js 18+ & npm
- Python 3.12+
- PostgreSQL instance (local or cloud)
- Google Gemini API Key ([Get one here](https://aistudio.google.com))

---

### 1. Clone the Repository
```bash
git clone https://github.com/mrsahiljaiswal/Structura.git
cd Structura
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate
# Activate (Linux/macOS)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/structura
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here   # optional fallback
```

```bash
# Run database migrations
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/api/v1/docs`

---

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:8000
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
```

```bash
# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/v1/health` | Health check |
| `POST` | `/api/v1/documents/upload` | Upload PDF & trigger course generation pipeline |
| `POST` | `/api/v1/documents/upload-batch` | Upload multiple PDFs for multi-document synthesis |
| `GET` | `/api/v1/courses` | List all courses for the authenticated user |
| `GET` | `/api/v1/courses/{course_id}` | Get specific course with chapters & lessons |
| `DELETE` | `/api/v1/courses/{course_id}` | Delete course and cascade-delete all child records |
| `GET` | `/api/v1/lessons/{lesson_id}` | Get lesson content, examples & key takeaways |
| `PATCH` | `/api/v1/lessons/{lesson_id}/complete` | Toggle lesson completion status |
| `POST` | `/api/v1/lessons/{lesson_id}/quiz` | Generate adaptive quiz for a lesson |
| `POST` | `/api/v1/chat` | RAG AI Tutor — course-grounded conversational Q&A |
| `GET` | `/api/v1/user/progress` | Get user study progress, streaks & analytics |
| `POST` | `/api/v1/user/progress` | Update user progress data |

> All protected endpoints require `X-User-Id` header (Clerk user ID).

---

## 🌐 Deployment Guide

### Frontend → Vercel
```
1. Connect GitHub repo to Vercel
2. Set Root Directory: frontend
3. Build Command: npm run build
4. Output Directory: dist
5. Add environment variables:
   VITE_API_URL = https://your-render-backend.onrender.com
   VITE_CLERK_PUBLISHABLE_KEY = pk_live_...
```

### Backend → Render
```
1. Create a new Web Service on Render
2. Connect GitHub repo
3. Root Directory: backend
4. Build Command: pip install -r requirements.txt
5. Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
6. Add environment variables:
   DATABASE_URL = postgresql://... (Internal Render DB URL)
   GEMINI_API_KEY = AIzaSy...
   GROQ_API_KEY = gsk_...
```

> ⚠️ Use the **Internal Database URL** (no domain suffix) when connecting from Render Web Service to Render PostgreSQL — it's faster and doesn't incur egress costs.

---

## 📄 License

MIT License © 2026 Sahil Jaiswal

---

<div align="center">

Built with ❤️ by [Sahil Jaiswal](https://github.com/mrsahiljaiswal)

⭐ Star this repo if you found it useful!

</div>