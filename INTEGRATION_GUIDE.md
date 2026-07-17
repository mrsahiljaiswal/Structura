# Backend Integration Guide

Version: 1.0

Status: Approved

Author: Sahil Jaiswal

---

# 1. Introduction

## Purpose

This document serves as the official architecture and migration guide for integrating the newly developed AI Course Generation Pipeline into the existing FastAPI backend.

The purpose of this migration is to transform the backend into a fully modular AI-powered educational content generation platform while preserving all existing backend capabilities.

Unlike a traditional software integration where two independent applications communicate with each other, this migration is a **codebase consolidation**.

The generated pipeline becomes the **native implementation** of the backend rather than an external dependency.

---

# 2. Background

During research and experimentation, a completely new AI Course Generation Pipeline was developed in a temporary workspace.

This workspace was generated independently for rapid prototyping.

The folder name used during development has **no architectural meaning** and should not appear in the final project.

The production backend should remain a **single unified FastAPI application**.

---

# 3. Migration Philosophy

The migration follows four principles.

## Principle 1

There should only be **one backend**.

Do not create:

- Another FastAPI project
- Another API server
- Wrapper services
- Bridge services
- Subprocesses
- External engines

---

## Principle 2

Prefer **merging** over **copying**.

If functionality already exists inside the backend, improve or extend it instead of creating duplicates.

---

## Principle 3

Reuse the existing backend infrastructure whenever possible.

This includes:

- SQLAlchemy
- PostgreSQL
- API Routers
- Dependency Injection
- Logging
- Configuration
- Environment Variables
- Authentication
- Storage

---

## Principle 4

The AI pipeline should become a first-class backend component.

The pipeline should feel as if it was designed as part of the backend from day one.

---

# 4. Existing Backend Responsibilities

The backend currently manages:

- Authentication
- Authorization
- User APIs
- Upload APIs
- Course APIs
- Database Persistence
- File Storage
- Logging
- Validation
- Error Handling

These responsibilities remain unchanged.

---

# 5. New Responsibilities

The backend will additionally become responsible for:

- Document Extraction
- Document Normalization
- Document Understanding
- Document Structure Analysis
- Knowledge Extraction
- Semantic Segmentation
- Educational Planning
- Lesson Authoring
- Lesson Review
- Course Assembly

---

# 6. Final Backend Architecture

```
backend/

├── api/
│
├── core/
│
├── database/
│
├── models/
│
├── schemas/
│
├── repositories/
│
├── services/
│   ├── document_extraction/
│   ├── document_normalization/
│   ├── document_understanding/
│   ├── document_structure/
│   ├── knowledge_extraction/
│   ├── semantic_segmentation/
│   ├── educational_planner/
│   ├── lesson_authoring/
│   ├── lesson_review/
│   └── course_assembly/
│
├── pipeline/
│
├── common/
│
├── uploads/
│
└── main.py
```

---

# 7. Pipeline Overview

The backend processing pipeline should follow the sequence below.

```
PDF Upload

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

Frontend Rendering
```

Each stage should be independent, reusable, and replaceable.

---

# 8. Module Responsibilities

## Document Extraction

Input

PDF

Output

ExtractedDocument

Responsibilities

- PDF parsing
- OCR (future)
- Metadata extraction
- Page extraction

---

## Document Normalization

Input

ExtractedDocument

Output

NormalizedDocument

Responsibilities

- Clean text
- Normalize spacing
- Remove artifacts
- Preserve semantic information

---

## Document Understanding

Input

NormalizedDocument

Output

UnderstoodDocument

Responsibilities

- Heading detection
- Topic detection
- Section identification
- Hierarchy analysis

---

## Document Structure

Responsibilities

- Section tree
- Heading hierarchy
- Parent-child relationships
- Document outline

---

## Knowledge Extraction

Responsibilities

- Concepts
- Definitions
- Keywords
- Relationships
- Terminology

---

## Semantic Segmentation

Responsibilities

- Educational chunking
- Learning units
- Topic boundaries
- Difficulty estimation

---

## Educational Planner

Responsibilities

- Course objectives
- Chapters
- Lessons
- Learning path

---

## Lesson Authoring

Responsibilities

- Lesson generation
- Examples
- Summaries
- Key takeaways

---

## Lesson Review

Responsibilities

- Hallucination checks
- Educational consistency
- Readability
- Completeness

---

## Course Assembly

Responsibilities

- Combine lessons
- Generate metadata
- Build final course
- Export JSON

---

# 9. Backend Workflow

The backend upload endpoint should execute the following.

```
Upload Request

↓

Store PDF

↓

Create Document Record

↓

Invoke Pipeline

↓

Execute Module 1

↓

Execute Module 2

↓

...

↓

Execute Module 10

↓

Persist Course

↓

Return Response
```

---

# 10. Data Flow

Every module should consume a structured schema and produce another structured schema.

```
PDF

↓

ExtractedDocument

↓

NormalizedDocument

↓

StructuredDocument

↓

KnowledgeGraph

↓

LearningUnits

↓

CoursePlan

↓

LessonCollection

↓

ReviewedLessons

↓

FinalCourse
```

Modules should never exchange raw dictionaries.

Always use typed schemas.

---

# 11. Coding Standards

Every module must satisfy:

- Single Responsibility Principle
- Dependency Injection
- Strong Typing
- Pydantic Validation
- Proper Logging
- Structured Exceptions
- Clear Documentation
- Unit Testability

---

# 12. Error Handling

Every module should:

- Catch recoverable errors.
- Log meaningful information.
- Raise custom exceptions.
- Preserve pipeline state.
- Allow graceful recovery.

---

# 13. Logging Strategy

Every module should log:

- Start time
- End time
- Processing duration
- Input summary
- Output summary
- Errors
- Warnings

Avoid logging sensitive user information.

---

# 14. Database Integration

Reuse existing:

- SQLAlchemy Engine
- Async Session
- Transactions
- Models
- Repositories

Do not introduce another persistence layer.

---

# 15. API Compatibility

Existing REST APIs should continue functioning.

If changes are required:

- Maintain backward compatibility whenever possible.
- Update schemas.
- Document changes.
- Update frontend if required.

---

# 16. Validation Strategy

After migration verify:

## Compilation

- Backend starts.
- No import errors.
- No syntax errors.

---

## Functional

- Upload works.
- Pipeline executes.
- Course generated.
- Course persisted.
- Retrieval works.
- Frontend renders.

---

## Quality

- No duplicate services.
- No duplicate schemas.
- No duplicate models.
- No dead code.
- No obsolete imports.

---

# 17. Cleanup

After successful migration:

Delete

- Temporary development folder
- Duplicate services
- Duplicate schemas
- Duplicate models
- Duplicate utilities
- Duplicate prompts
- Dead code

---

# 18. Migration Deliverables

The migration should produce:

- Unified FastAPI backend
- Native AI pipeline
- Updated folder structure
- Updated documentation
- Updated dependency graph
- Migration report
- Passing tests

---

# 19. Success Criteria

The migration is successful when:

✓ Only one backend exists.

✓ The AI pipeline is native to the backend.

✓ Existing functionality is preserved.

✓ New pipeline executes successfully.

✓ Database persistence works.

✓ Frontend works without modification.

✓ No temporary development artifacts remain.

---

# 20. Future Extensions

The architecture should allow future addition of:

- AI Tutor
- Flashcards
- Quiz Generation
- Mind Maps
- Voice Tutor
- RAG Integration
- Multi-LLM Support
- Background Processing
- Distributed Workers

without requiring changes to the core pipeline architecture.

---

# 21. Conclusion

This migration is not simply about moving files.

Its objective is to evolve the existing FastAPI backend into a production-grade modular AI platform capable of converting complex technical documents into structured educational courses while maintaining a clean, scalable, and maintainable architecture.

Every decision during migration should prioritize:

- Simplicity
- Reusability
- Maintainability
- Modularity
- Production Readiness