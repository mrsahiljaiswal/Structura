# 🚀 Structura — AI Document Intelligence & Adaptive E-Course Platform

> **Transform Raw PDF Textbooks & Engineering Manuals into Structured, Interactive E-Courses in under 45 seconds.**

Structura is a full-stack document-intelligence platform powered by an **8-Stage NLP Pipeline** using **Google Gemini 3.1 & 2.5 Flash Lite**. It enforces a strict **100% Verbatim Preservation Directive** to completely eliminate LLM hallucinations while generating interactive courses, grounded RAG AI tutoring, SVG concept flowcharts, and dynamic study analytics.

---

## 📑 Table of Contents
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [The 8-Stage Document Intelligence Pipeline](#-the-8-stage-document-intelligence-pipeline)
- [Tech Stack](#-tech-stack)
- [Local Setup & Installation](#-local-setup--installation)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Deployment Guide](#-deployment-guide)

---

## ✨ Key Features

1. **Strict 100% Verbatim Preservation Directive**:
   - Acts as a structural compiler for uploaded textbooks. Zero outside facts or fabricated ungrounded examples are introduced.
2. **Dual-Model LLM Routing**:
   - **Google Gemini 3.1 Flash Lite**: Ingests massive PDF context windows (1M tokens) for structural analysis and lesson authoring.
   - **Google Gemini 2.5 Flash Lite**: Delivers sub-second response times for the course-grounded RAG AI Tutor and Practice Challenge quiz generator.
3. **Interactive SVG Concept Flowcharts**:
   - Vector path diagrams connecting the Central Knowledge Hub to Chapter Nodes and Lesson Branches.
4. **Course-Grounded RAG AI Study Suite**:
   - Feature 1: **RAG Chat** with relevance filter (`score > 0.15`) preventing false course grounding.
   - Feature 2: **Socratic Explainer** (ELI5, Analogy, Deep Academic Breakdown, Misconceptions).
   - Feature 3: **Practice Challenge Quiz Generator** with question type selection (*Multiple Choice*, *True/False*, *Mixed*, *Coding/Short Answer*).
5. **Real-Time Study Analytics & Time Persistence**:
   - Automatically tracks study time across lesson reading, AI Tutor conversations, and practice quizzes, persisting daily streaks and average quiz scores.

---

## 🏛️ System Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    Next.js 15 Frontend                    │
│   TanStack Query v5 • Tailwind Dark Glassmorphic Theme    │
└─────────────────────────────┬─────────────────────────────┘
                              │ HTTP REST / JSON
                              ▼
┌───────────────────────────────────────────────────────────┐
│                     FastAPI Async API                     │
│    Python 3.11 • SQLAlchemy 2.0 • PostgreSQL Database    │
└─────────────────────────────┬─────────────────────────────┘
                              │
             ┌────────────────┴────────────────┐
             ▼                                 ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│  Gemini 3.1 Flash Lite  │       │  Gemini 2.5 Flash Lite  │
│  • 8-Stage PDF Ingestion │       │  • Grounded RAG Chatbot │
│  • Structural Analysis  │       │  • Socratic Explainer   │
│  • Lesson Authoring     │       │  • Practice Quizzes     │
└─────────────────────────┘       └─────────────────────────┘
```

---

## 🔬 The 8-Stage Document Intelligence Pipeline

1. **Document Normalization**: Extracts raw PDF text streams via `PyPDF`/`PDFPlumber` and cleans irregular whitespace.
2. **Document Understanding**: Classifies document types (`book`, `lecture_notes`, `paper`) and extracts metadata via `gemini-3.1-flash-lite`.
3. **Structural Analysis**: Constructs a hierarchical node tree mapping headings, sections, and subsections.
4. **Knowledge Extraction**: Extracts domain concepts, definitions, and directed prerequisite edges (`Concept A -> Concept B`).
5. **Semantic Segmentation**: Groups concepts into complete Learning Units without character truncation caps.
6. **Educational Planning**: Computes a deterministic topological sort on concept prerequisite edges to arrange topics in optimal learning order.
7. **Lesson Authoring**: Authors Markdown theory, worked examples, and key takeaways enforcing 100% verbatim text retention.
8. **Persistence**: Saves relational `Course`, `Chapter`, and `Lesson` models into PostgreSQL using Async SQLAlchemy.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, TanStack React Query v5, Clerk Auth, Lucide Icons.
- **Backend**: Python 3.11, FastAPI, Async SQLAlchemy 2.0, Pydantic v2, PostgreSQL (Render DB), Starlette CORS.
- **AI Models**: Google Gemini 3.1 & 2.5 Flash Lite (`google.generativeai`).

---

## ⚡ Local Setup & Installation

### Prerequisites
- Node.js 18+ & npm
- Python 3.11+
- PostgreSQL database instance

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Linux/macOS: source venv/bin/activate
pip install -r requirements.txt

# Create .env file in backend/
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/structura"
GEMINI_API_KEY="your_gemini_api_key_here"

# Run FastAPI Server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Create .env.local file in frontend/
NEXT_PUBLIC_API_URL="http://localhost:8000"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_pub_key"
CLERK_SECRET_KEY="your_clerk_secret_key"

# Run Next.js Dev Server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/documents/upload` | Upload PDF binary & trigger 8-stage course generation pipeline |
| `GET` | `/api/v1/courses` | Retrieve enrolled user courses tree (Chapters & Lessons) |
| `GET` | `/api/v1/courses/{course_id}` | Retrieve specific course details & chapters |
| `DELETE` | `/api/v1/courses/{course_id}` | Delete course and cascade delete child chapters & lessons |
| `GET` | `/api/v1/lessons/{lesson_id}` | Retrieve lesson theory, worked examples, and key takeaways |
| `PATCH` | `/api/v1/lessons/{lesson_id}/complete` | Toggle lesson completion status |
| `POST` | `/api/v1/lessons/{lesson_id}/quiz` | Generate lesson practice quiz questions |
| `POST` | `/api/v1/chat` | Course-grounded RAG chatbot & AI Tutor assistant |

---

## 🌐 Deployment Guide

### Vercel (Frontend)
- Connect repository to Vercel.
- Set Root Directory to `frontend` or rely on root `vercel.json`.
- Add environment variable `NEXT_PUBLIC_API_URL` pointing to your deployed Render backend.

### Render (Backend)
- Deploy Python Web Service using `render.yaml` or manual setup.
- Build Command: `pip install -r requirements.txt`.
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

---

&copy; 2026 Structura Inc. Released under the MIT License.