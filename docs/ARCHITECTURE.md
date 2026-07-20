# 🏛️ Structura System Architecture

## Executive Summary

Structura is an AI-powered document intelligence and adaptive learning platform. It transforms unstructured PDF textbooks, engineering documentation, and research papers into structured, interactive e-courses in under 45 seconds.

The system uses a **Layered Service-Repository Architecture** built on:
- **Frontend**: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS with dark glassmorphism, Framer Motion, TanStack React Query v5, Clerk Auth.
- **Backend**: Python 3.11, FastAPI, Async SQLAlchemy 2.0, PostgreSQL (Render DB), Starlette CORS.
- **AI Engine**: Google Gemini 3.1 & 2.5 Flash Lite dual-model pipeline.

---

## High-Level System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                      Next.js 15 Client App                       │
│    Dashboard • Course Reader • AI Tutor Suite • Mind Maps        │
└────────────────────────────────┬─────────────────────────────────┘
                                 │ HTTPS REST API / JSON
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                       FastAPI Async Backend                      │
│   Async SQLAlchemy 2.0 • Pydantic v2 • CORS • Clerk Auth Middleware│
└────────────────────────────────┬─────────────────────────────────┘
                                 │
             ┌───────────────────┴───────────────────┐
             ▼                                       ▼
┌───────────────────────────┐           ┌───────────────────────────┐
│   PostgreSQL Database     │           │    Google Gemini API      │
│ • Documents, Courses      │           │ • 3.1 Flash Lite (Parse)  │
│ • Chapters, Lessons       │           │ • 2.5 Flash Lite (RAG)    │
│ • Progress & Analytics    │           └───────────────────────────┘
└───────────────────────────┘
```

---

## Technology Stack Justifications

### 1. Backend: FastAPI & Python 3.11
- **Async Native I/O**: FastAPI uses `asyncio` and `uvicorn`, enabling thousands of concurrent non-blocking requests.
- **Python NLP Ecosystem**: Python provides native PDF parsing libraries (`PyPDF`, `PDFPlumber`) with superior coordinate text extraction.
- **Pydantic v2 Type Safety**: Validates schemas at runtime with compiled Rust speed.

### 2. Database: PostgreSQL + JSONB
- **Relational Integrity**: Foreign key cascade deletes (`ON DELETE CASCADE`) guarantee that deleting a course cleans up child chapters and lessons cleanly.
- **Hybrid JSONB Support**: Native JSONB columns store takeaways, worked examples, and quiz scores inside relational rows.

### 3. AI Models: Dual-Model Gemini Allocation
- **Gemini 3.1 Flash Lite**: Ingests up to 1,000,000 tokens per window with strict JSON compliance. Handles PDF normalization, topological planning, and verbatim lesson authoring.
- **Gemini 2.5 Flash Lite**: Delivers sub-second latency for interactive RAG Chatbot queries, Socratic Explainers, and practice quizzes.

### 4. Frontend: Next.js 15 & TanStack React Query v5
- **Next.js 15 App Router**: Provides fast initial loads, route handlers, and component layout nesting.
- **TanStack React Query v5**: Automatically manages server state caching (`staleTime: 0`) and triggers instant cache refetching on course generation.

---

## Subsystem Architecture

### 1. Document Ingestion Subsystem
- `upload-drop-zone.tsx` receives PDF binary streams (< 50MB) and dispatches multipart POST requests to `/api/v1/documents/upload`.
- FastAPI streams binary bytes into `DocumentNormalizationService` without saving temporary files to disk.

### 2. 8-Stage NLP Document Pipeline Subsystem
- Normalization $\rightarrow$ Document Understanding $\rightarrow$ Structural Analysis $\rightarrow$ Knowledge Extraction $\rightarrow$ Semantic Segmentation $\rightarrow$ Educational Planning $\rightarrow$ Lesson Authoring $\rightarrow$ Persistence.

### 3. Grounded RAG AI Tutor Subsystem
- `/api/v1/chat` queries enrolled user courses, computes keyword/fuzzy relevance grounding scores, rejects candidates below `0.15` threshold, and passes top context chunks to `gemini-2.5-flash-lite`.

### 4. Client State & Study Analytics Persistence
- `CoursePersistenceService` singleton tracks study duration across reading, AI tutor chats, and practice quizzes, broadcasting custom `storage` events for real-time UI updates.