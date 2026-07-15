# Structura Architecture

## Overview

Structura is an AI-powered SaaS platform that transforms static documents into structured, interactive learning experiences.

Instead of simply displaying PDFs, Structura extracts knowledge from documents and generates AI-powered courses consisting of chapters, lessons, quizzes, summaries, and an intelligent learning companion.

The architecture is designed around modular services, allowing each component to evolve independently while maintaining a clean separation of concerns.

---

# Architecture Goals

The architecture aims to achieve:

- Scalability
- Maintainability
- Modularity
- Separation of Concerns
- AI-first Design
- Production-ready Codebase

---

# High-Level Architecture

```text
                    ┌──────────────────────────┐
                    │        Frontend          │
                    │       (Next.js)          │
                    └────────────┬─────────────┘
                                 │
                           HTTPS / REST
                                 │
                    ┌────────────▼─────────────┐
                    │      FastAPI Backend      │
                    └────────────┬─────────────┘
                                 │
      ┌───────────────┬──────────┼──────────────┬──────────────┐
      │               │          │              │              │
      ▼               ▼          ▼              ▼              ▼
 Authentication  Document     Course AI      AI Tutor      Quiz Engine
    Service      Service       Service        Service         Service
      │               │          │              │              │
      └───────────────┴──────────┼──────────────┴──────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      PostgreSQL         │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │       ChromaDB          │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      Groq LLM API       │
                    └─────────────────────────┘
```

---

# Technology Stack

## Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Query
- React Hook Form
- Zod
- Axios
- Framer Motion
- Lucide Icons

---

## Backend

- FastAPI
- SQLAlchemy 2
- Alembic
- Pydantic Settings

---

## Database

PostgreSQL

Stores:

- Users
- Documents
- Courses
- Chapters
- Lessons
- Progress
- Quiz Results
- Chat History

---

## Vector Database

ChromaDB

Stores:

- Document Embeddings
- Semantic Search Index

---

## AI

Groq

Responsibilities:

- Course Generation
- Lesson Generation
- Quiz Generation
- AI Tutor
- Summarization

---

# Frontend Architecture

```text
Frontend

Landing

Dashboard

Upload

Course Viewer

Lesson Viewer

Quiz

AI Tutor

Profile
```

Responsibilities

- User Interface
- Authentication
- State Management
- API Communication
- Markdown Rendering

---

# Backend Architecture

The backend follows a layered architecture.

```text
API Layer

↓

Service Layer

↓

Repository Layer

↓

Database
```

---

## API Layer

Responsible for

- Request Validation
- Authentication
- Response Formatting

Contains

```text
/api/v1
```

---

## Service Layer

Contains business logic.

Examples

- Course Generation
- Quiz Generation
- AI Tutor
- Document Processing

---

## Repository Layer

Responsible for database access.

Advantages

- Easy testing
- Clean separation
- Replace database without changing business logic

---

# Core Services

## Authentication Service

Responsibilities

- User Authentication
- Session Validation
- User Creation

---

## Document Service

Responsibilities

- Upload files
- Store metadata
- Extract text
- Manage processing status

---

## AI Course Service

Responsibilities

- Generate course metadata
- Generate chapters
- Generate lessons
- Generate summaries

---

## AI Tutor Service

Responsibilities

- Answer questions
- Summarize chapters
- Explain difficult concepts
- Suggest next lessons

---

## Quiz Service

Responsibilities

- Generate quizzes
- Evaluate answers
- Calculate scores

---

## Progress Service

Responsibilities

- Track lesson completion
- Calculate course completion
- Store learning analytics

---

# Database Design Philosophy

Separate the uploaded document from the generated course.

```text
Document

↓

Course
```

Advantages

- Regenerate courses
- Support DOCX
- Support PPT
- Maintain original source

---

# Request Flow

```text
User

↓

Next.js

↓

FastAPI

↓

Service

↓

Repository

↓

Database
```

---

# AI Request Flow

```text
User

↓

FastAPI

↓

AI Service

↓

Groq

↓

Response

↓

Database

↓

Frontend
```

---

# Folder Structure

## Frontend

```text
frontend/

src/

app/

components/

hooks/

lib/

providers/

services/

types/
```

---

## Backend

```text
backend/

app/

api/

core/

models/

schemas/

repositories/

services/

dependencies/

utils/

main.py
```

---

# Security

Authentication

- Clerk

Authorization

- JWT Validation

Environment Variables

- .env

Secrets

- Never hardcoded

---

# Scalability

The architecture supports future additions:

- DOCX Upload
- PowerPoint Upload
- Flashcards
- Mind Maps
- Audio Narration
- Course Certificates
- Team Workspaces

without major redesign.

---

# Design Principles

- Single Responsibility Principle
- Separation of Concerns
- Modular Services
- Reusable Components
- API-first Design
- AI-first Architecture
- Scalable Database Design

---

# Architecture Summary

Structura is built using a modular client-server architecture where the frontend handles user experience, the backend orchestrates business logic and AI workflows, PostgreSQL stores structured application data, ChromaDB powers semantic retrieval, and Groq provides large language model capabilities.

This design keeps the application clean, scalable, and easy to maintain while supporting future AI-powered features.