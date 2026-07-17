# Structura Backend Migration & Integration Prompt

Version: 1.0

Status: Active

Owner: Sahil Jaiswal

Purpose:
This document defines the migration strategy, expectations, constraints, coding standards, and acceptance criteria for integrating the newly developed AI Course Generation Pipeline into the existing FastAPI backend.

---

# 1. Background

The project already contains a fully functional backend implemented using FastAPI.

The backend currently supports:

- Authentication
- User Management
- PDF Upload
- Document Storage
- PostgreSQL Persistence
- Course Retrieval APIs
- Frontend Integration

During research and experimentation, a completely new modular AI Course Generation Pipeline was developed separately.

The pipeline was generated inside a folder named:

```

structura/

```

This folder name has absolutely no architectural meaning.

It is only a temporary development workspace.

The final application MUST NOT contain this folder.

---

# 2. Objective

The objective is NOT to integrate an external engine.

The objective is NOT to create another backend.

The objective is NOT to create a wrapper around the generated pipeline.

Instead,

The objective is to migrate every reusable module from the temporary development workspace into the existing FastAPI backend so that the backend itself becomes the home of the complete AI Course Generation Pipeline.

The backend should remain a single unified FastAPI application.

---

# 3. Existing Technology Stack

The existing project already uses the following technology stack.

## Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Clerk Authentication

## Backend

- FastAPI
- Python 3.12
- SQLAlchemy
- PostgreSQL
- Alembic
- Pydantic v2

## AI Layer

- Groq API
- OpenAI Compatible APIs
- LangChain (where required)

## Storage

- PostgreSQL
- Local Upload Storage
- JSON Artifact Storage

---

# 4. Existing Backend Responsibilities

The backend is already responsible for:

- Authentication
- Authorization
- Upload APIs
- Course APIs
- User APIs
- Database Persistence
- Progress Tracking
- File Storage
- API Validation
- Error Handling
- Logging

These responsibilities MUST remain unchanged.

---

# 5. Generated Pipeline Responsibilities

The generated pipeline introduces a new modular architecture consisting of:

1. Document Extraction

2. Document Normalization

3. Document Understanding

4. Document Structure Analysis

5. Knowledge Extraction

6. Semantic Segmentation

7. Educational Planning

8. Lesson Authoring

9. Lesson Review

10. Course Assembly

These modules should become native backend services.

---

# 6. IMPORTANT

The generated folder is NOT another backend.

It is NOT a microservice.

It is NOT an SDK.

It is NOT a package.

It is NOT an external engine.

It is NOT a subprocess.

It is NOT a wrapper.

It is only a temporary development workspace.

After migration this folder should no longer be needed.

---

# 7. Migration Goal

Transform

Temporary Development Folder

↓

Existing Backend

↓

Unified Production Backend

There must only be ONE backend.

---

# 8. Expected Final Architecture

backend/

api/

core/

database/

models/

schemas/

services/

document_extraction/

document_normalization/

document_understanding/

document_structure/

knowledge_extraction/

semantic_segmentation/

educational_planner/

lesson_authoring/

lesson_review/

course_assembly/

pipeline/

common/

tests/

main.py

No temporary structura folder should remain.

---

# 9. Migration Philosophy

Always MERGE.

Never duplicate.

Always REFACTOR.

Never wrap existing implementations.

Reuse existing infrastructure whenever possible.

The generated modules should become first-class backend services.

---

# 10. Your Tasks

Your responsibilities include the following.

## Step 1

Analyze the entire existing backend.

Understand:

- APIs
- Folder structure
- Models
- Schemas
- Services
- Database
- Utilities

Do not begin migration until the backend has been understood.

---

## Step 2

Analyze every generated module.

Understand:

- Dependencies
- Shared utilities
- Schemas
- Configuration
- Exceptions
- Pipeline flow

---

## Step 3

Identify duplicated code.

Examples include:

- Configuration
- Logging
- Exceptions
- LLM Clients
- JSON Utilities
- Validators
- Database utilities
- Common helper functions

---

## Step 4

Merge duplicated code.

Prefer existing backend implementations whenever they already satisfy the requirements.

Only replace implementations when the generated version provides a clear improvement.

---

## Step 5

Move every AI module into the backend.

This includes:

Document Extraction

↓

Document Normalization

↓

Document Understanding

↓

Document Structure

↓

Knowledge Extraction

↓

Semantic Segmentation

↓

Educational Planner

↓

Lesson Authoring

↓

Lesson Review

↓

Course Assembly

---

## Step 6

Move the pipeline orchestrator.

The backend should expose only one orchestrator responsible for coordinating the entire AI pipeline.

---

## Step 7

Update all imports.

Every module should import from the backend.

Nothing should reference the temporary development folder.

---

## Step 8

Integrate with the existing upload workflow.

Current upload flow should become:

Upload PDF

↓

Store File

↓

Pipeline Orchestrator

↓

Module 1

↓

Module 2

↓

Module 3

↓

...

↓

Module 10

↓

Persist Final Course

↓

Return API Response

---

## Step 9

Integrate with PostgreSQL.

Reuse the existing:

- SQLAlchemy session
- Models
- Transactions
- Connection management

Avoid introducing a second database layer.

---

## Step 10

Integrate with API responses.

Frontend APIs should remain compatible.

Avoid breaking existing endpoints.

---

# 11. Rules

## Never create

- Another FastAPI project
- Another backend
- Another API layer
- Wrapper services
- Bridge layers
- Duplicate utilities
- Duplicate schemas
- Duplicate models
- Duplicate configuration
- Duplicate logging
- Duplicate exception handling

---

## Always

Reuse

Refactor

Simplify

Merge

Document

Validate

---

# 12. Code Quality Expectations

Every new module should satisfy:

- SOLID principles
- Clean Architecture
- Single Responsibility
- Dependency Injection
- Type Hints
- Pydantic validation
- Proper logging
- Proper error handling
- Unit-testable design

Avoid monolithic services.

---

# 13. Existing Features That Must Continue Working

The migration MUST NOT break:

- User Authentication
- Clerk Integration
- PDF Upload
- Progress Tracking
- Database Persistence
- Course APIs
- Course Reader
- Existing Frontend

---

# 14. Expected Pipeline

The final pipeline should be

PDF

↓

Document Extraction

↓

Document Normalization

↓

Document Understanding

↓

Document Structure

↓

Knowledge Extraction

↓

Semantic Segmentation

↓

Educational Planner

↓

Lesson Authoring

↓

Lesson Review

↓

Course Assembly

↓

Database Persistence

↓

Frontend

---

# 15. Migration Constraints

Do not change APIs unless absolutely necessary.

Do not introduce unnecessary abstractions.

Do not introduce unnecessary dependencies.

Do not over-engineer.

Prefer readability over cleverness.

---

# 16. Deliverables

After migration the project should contain:

✔ One unified FastAPI backend

✔ Modular AI Pipeline

✔ Updated folder structure

✔ Updated imports

✔ Updated orchestrator

✔ Updated schemas

✔ Updated services

✔ Updated tests

✔ Updated documentation

---

# 17. Validation

Migration is complete only if all of the following succeed.

Backend compiles.

Backend starts.

Database connects.

Upload API works.

Pipeline executes.

Course is generated.

Course is stored.

Frontend renders course.

No duplicate implementations remain.

The temporary development folder can be safely deleted.

---

# 18. Final Output

At the end of the migration provide a detailed report including:

1. Files moved

2. Files deleted

3. Files merged

4. Files renamed

5. Services integrated

6. Duplicate code removed

7. APIs modified

8. Schemas modified

9. Models modified

10. Remaining TODOs

11. Recommendations

The migration should leave the project with a clean, maintainable, production-grade FastAPI backend that natively contains the complete AI Course Generation Pipeline.