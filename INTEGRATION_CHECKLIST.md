# Backend Migration Checklist

Version: 1.0

Status: Active

Purpose:
This checklist defines every activity required to successfully migrate the newly developed AI Course Generation Pipeline into the existing FastAPI backend.

The migration is considered complete only when every checklist item has been verified.

---

# Overall Migration Workflow

```
Current Backend
        │
        ▼
Analyze Existing Backend
        │
        ▼
Analyze Generated Pipeline
        │
        ▼
Plan Migration
        │
        ▼
Merge Common Components
        │
        ▼
Move AI Services
        │
        ▼
Integrate Pipeline
        │
        ▼
Update APIs
        │
        ▼
Validate Backend
        │
        ▼
Remove Temporary Code
        │
        ▼
Final Production Backend
```

---

# Phase 1 — Backend Analysis

## Objective

Understand the current backend completely before modifying any code.

---

## Folder Analysis

- [ ] Inspect complete backend folder structure.
- [ ] Identify all FastAPI routers.
- [ ] Identify API versioning.
- [ ] Identify middleware.
- [ ] Identify dependency injection.
- [ ] Identify database configuration.
- [ ] Identify upload workflow.
- [ ] Identify course generation workflow.
- [ ] Identify persistence workflow.
- [ ] Identify logging system.
- [ ] Identify exception handling.

---

## Codebase Analysis

- [ ] Review services.
- [ ] Review models.
- [ ] Review schemas.
- [ ] Review repositories.
- [ ] Review utilities.
- [ ] Review validators.
- [ ] Review pipeline.
- [ ] Review storage.
- [ ] Review tests.

---

## Existing AI Components

- [ ] Locate extraction service.
- [ ] Locate cleaning service.
- [ ] Locate chunking service.
- [ ] Locate planner service.
- [ ] Locate lesson generation.
- [ ] Locate persistence layer.

---

# Phase 2 — Generated Pipeline Analysis

## Objective

Understand every generated module.

---

## Module Review

- [ ] Document Extraction
- [ ] Document Normalization
- [ ] Document Understanding
- [ ] Document Structure
- [ ] Knowledge Extraction
- [ ] Semantic Segmentation
- [ ] Educational Planner
- [ ] Lesson Authoring
- [ ] Lesson Review
- [ ] Course Assembly

---

## Shared Components

- [ ] Common utilities
- [ ] Logging
- [ ] Configuration
- [ ] Exceptions
- [ ] Validators
- [ ] Schemas
- [ ] Prompt library
- [ ] LLM client

---

## Pipeline Review

- [ ] Understand execution order.
- [ ] Understand dependencies.
- [ ] Understand inputs.
- [ ] Understand outputs.
- [ ] Understand intermediate artifacts.

---

# Phase 3 — Migration Planning

## Compare Both Codebases

- [ ] Compare services.
- [ ] Compare schemas.
- [ ] Compare models.
- [ ] Compare configuration.
- [ ] Compare utilities.
- [ ] Compare prompts.
- [ ] Compare LLM integrations.
- [ ] Compare storage.
- [ ] Compare logging.

---

## Duplication Report

Identify

- [ ] Duplicate services
- [ ] Duplicate schemas
- [ ] Duplicate models
- [ ] Duplicate helpers
- [ ] Duplicate validators
- [ ] Duplicate prompts
- [ ] Duplicate exceptions
- [ ] Duplicate logging

---

# Phase 4 — Common Infrastructure Migration

## Configuration

- [ ] Merge configuration.
- [ ] Merge environment variables.
- [ ] Merge constants.
- [ ] Merge feature flags.

---

## Logging

- [ ] Merge logging.
- [ ] Remove duplicate loggers.

---

## Exceptions

- [ ] Merge exceptions.
- [ ] Remove duplicate exception handlers.

---

## Utilities

- [ ] Merge helper functions.
- [ ] Merge validators.
- [ ] Merge JSON helpers.
- [ ] Merge file helpers.

---

## LLM

- [ ] Merge LLM client.
- [ ] Merge prompt loader.
- [ ] Merge retry strategy.

---

# Phase 5 — AI Module Migration

## Document Extraction

- [ ] Move module.
- [ ] Update imports.
- [ ] Remove duplicates.
- [ ] Verify.

---

## Document Normalization

- [ ] Move module.
- [ ] Update imports.
- [ ] Verify.

---

## Document Understanding

- [ ] Move module.
- [ ] Update imports.
- [ ] Verify.

---

## Document Structure

- [ ] Move module.
- [ ] Update imports.
- [ ] Verify.

---

## Knowledge Extraction

- [ ] Move module.
- [ ] Update imports.
- [ ] Verify.

---

## Semantic Segmentation

- [ ] Move module.
- [ ] Update imports.
- [ ] Verify.

---

## Educational Planner

- [ ] Move module.
- [ ] Update imports.
- [ ] Verify.

---

## Lesson Authoring

- [ ] Move module.
- [ ] Update imports.
- [ ] Verify.

---

## Lesson Review

- [ ] Move module.
- [ ] Update imports.
- [ ] Verify.

---

## Course Assembly

- [ ] Move module.
- [ ] Update imports.
- [ ] Verify.

---

# Phase 6 — Pipeline Integration

## Pipeline

- [ ] Create native orchestrator.
- [ ] Connect all modules.
- [ ] Remove temporary orchestrator.
- [ ] Verify execution order.

---

## Upload Flow

Current

```
Upload

↓

Extract

↓

Chunk

↓

Course
```

Target

```
Upload

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

Persist
```

---

# Phase 7 — Backend Integration

## APIs

- [ ] Upload API
- [ ] Course API
- [ ] Lesson API
- [ ] Progress API

---

## Database

- [ ] Reuse SQLAlchemy.
- [ ] Reuse session.
- [ ] Reuse transactions.
- [ ] Verify persistence.

---

## Schemas

- [ ] Merge Pydantic schemas.
- [ ] Remove duplicates.
- [ ] Update validation.

---

## Models

- [ ] Merge SQLAlchemy models.
- [ ] Remove obsolete models.

---

# Phase 8 — Frontend Compatibility

- [ ] Upload still works.
- [ ] Progress updates.
- [ ] Course retrieval.
- [ ] Lesson rendering.
- [ ] Reader works.
- [ ] Authentication unaffected.

---

# Phase 9 — Cleanup

## Remove

- [ ] Temporary folder
- [ ] Dead code
- [ ] Duplicate services
- [ ] Duplicate schemas
- [ ] Duplicate prompts
- [ ] Duplicate configuration
- [ ] Duplicate utilities
- [ ] Unused imports

---

## Refactor

- [ ] Improve naming.
- [ ] Improve folder structure.
- [ ] Improve comments.
- [ ] Improve documentation.

---

# Phase 10 — Validation

## Compilation

- [ ] Project compiles.
- [ ] No syntax errors.
- [ ] No import errors.

---

## Quality

- [ ] Type checking.
- [ ] Lint passes.
- [ ] Formatting passes.

---

## Functional

- [ ] Upload PDF.
- [ ] Extract.
- [ ] Normalize.
- [ ] Understand.
- [ ] Build structure.
- [ ] Extract knowledge.
- [ ] Segment.
- [ ] Plan course.
- [ ] Generate lessons.
- [ ] Review lessons.
- [ ] Assemble course.
- [ ] Persist.
- [ ] Retrieve.
- [ ] Render.

---

## Performance

- [ ] Memory stable.
- [ ] No duplicate processing.
- [ ] Logging works.
- [ ] Progress reporting works.

---

# Migration Complete Criteria

The migration is complete only when:

- [ ] One FastAPI backend exists.
- [ ] No temporary development folder remains.
- [ ] All AI modules are native backend services.
- [ ] Existing frontend continues working.
- [ ] Existing APIs continue working.
- [ ] Pipeline executes end-to-end.
- [ ] Course generation succeeds.
- [ ] PostgreSQL persistence succeeds.
- [ ] Documentation updated.
- [ ] Migration report generated.

---

# Final Deliverables

Claude must provide:

- Backend Migration Report
- Updated Folder Structure
- Dependency Graph
- Files Added
- Files Deleted
- Files Modified
- APIs Updated
- Schemas Updated
- Remaining TODOs
- Recommendations for future improvements

Only after every checklist item has been completed should the migration be considered production-ready.