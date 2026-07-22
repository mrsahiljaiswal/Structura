# 🧠 The 10-Stage Document Intelligence Pipeline

The core engine of Structura is a 10-stage document intelligence pipeline that transforms raw PDF binary documents into structured, interactive, and pedagogically sound courses.

---

## Pipeline Overview

```
[Raw PDF] ──> Stage 1: Document Extraction
              ──> Stage 2: Document Normalization
              ──> Stage 3: Document Understanding (Gemini 3.1)
              ──> Stage 4: Document Structure
              ──> Stage 5: Knowledge Extraction
              ──> Stage 6: Semantic Segmentation
              ──> Stage 7: Educational Planner (Gemini 3.1)
              ──> Stage 8: Lesson Authoring (Problem-First + Gemini 3.1)
              ──> Stage 9: Educational Review (Critique Rubric + Gemini 3.1)
                  └──> (If Rejected) Auto-Repair Retry Loop (Max 2 Attempts)
              ──> Stage 10: Course Assembly & Database Persistence (PostgreSQL)
```

---

## Detailed Stage Breakdown

### Stage 1: Document Extraction (`document_extraction`)
- **Input**: Raw PDF binary byte stream.
- **Process**: Reads PDF content using layout-aware spatial text extractors (`PyPDF`, `PDFPlumber`).
- **Output**: `ExtractedDocument(pages=[ExtractedPage])`.

### Stage 2: Document Normalization (`document_normalization`)
- **Input**: `ExtractedDocument`.
- **Process**: Standardizes character sets, fixes irregular whitespace, and normalizes spacing while keeping formatting marks.
- **Output**: Cleaned and token-ready text stream.

### Stage 3: Document Understanding (`document_understanding`)
- **Input**: Normalized front matter (pages 1–5) and back matter (last 3 pages).
- **Process**: Prompts `gemini-3.1-flash-lite` to classify document genre (`book`, `manual`, `lecture_notes`, etc.) and compile metadata.
- **Output**: `DocumentProfile(document_type, title, author, language)`.

### Stage 4: Document Structure (`document_structure`)
- **Input**: Normalized text stream.
- **Process**: Constructs a nested structural tree mapping heading boundaries (chapters, sections, subsections).
- **Output**: `DocumentStructure(tree=StructureNode)`.

### Stage 5: Knowledge Extraction (`knowledge_extraction`)
- **Input**: `DocumentStructure`.
- **Process**: Prompts `gemini-3.1-flash-lite` to identify core concepts, definitions, difficulty levels, and prerequisite dependency edges.
- **Output**: `KnowledgeGraph(concepts=[Concept], edges=[KnowledgeEdge])`.

### Stage 6: Semantic Segmentation (`semantic_segmentation`)
- **Input**: `DocumentStructure` and `KnowledgeGraph`.
- **Process**: Groups concepts into complete **Learning Units** without arbitrary truncation boundaries, preserving full contextual sentences, tables, and code snippets.
- **Output**: `LearningUnitSet(units=[LearningUnit])`.

### Stage 7: Educational Planning (`educational_planner`)
- **Input**: `KnowledgeGraph` and `LearningUnitSet`.
- **Process**: Performs a deterministic topological sort on prerequisite edges to sequence concepts. Prompts `gemini-3.1-flash-lite` to output a structured curriculum.
- **Output**: `CoursePlan(modules=[PlannedModule(chapters=[PlannedChapter(lessons=[PlannedLesson])])])`.

### Stage 8: Lesson Authoring (`lesson_authoring`)
- **Input**: `PlannedLesson` and source `LearningUnit` contents.
- **Process**: Prompts `gemini-3.1-flash-lite` to output structured lessons using a textbook problem-first teaching template. Captures `evidence_mapping` tracing output segments to their exact source pages.
- **Output**: `Lesson` model.

### Stage 9: Educational Review (`lesson_review` / `repair_loop`)
- **Input**: `Lesson` and source `LearningUnit` contents.
- **Process**: Evaluates the lesson against a **9-Dimensional Critique Rubric** (grounding, concept accuracy, completeness, pedagogy, clarity, etc.) and performs server-side score validation.
- **Auto-Repair Loop**: If the lesson falls below the strict grounding floor (score `< 60`) or has high-severity issues (hallucinations), it is routed back to the authoring LLM along with feedback detailing specific failures. Retries run up to **2 times** before falling back to manual review.
- **Output**: `ReviewedLesson` model (approved or unapproved).

### Stage 10: Course Assembly (`course_assembly`)
- **Input**: `CoursePlan` and all approved `ReviewedLesson`s.
- **Process**: Validates complete course graph integrity (no broken prerequisites) and commits relational entities (`Course`, `Chapter`, `Lesson`) into PostgreSQL.
- **Output**: Database persistent records.

---

## 9-Dimensional Critique Rubric Weights

Server-side score calculation dynamically derives the top-line quality score based on the following weighted dimensions:
- `grounding` (20%) — Strict grounding verification (minimum floor score: 60)
- `concept_accuracy` (15%)
- `completeness` (15%)
- `educational_value` (15%)
- `pedagogy` (10%)
- `clarity` (10%)
- `flow` (5%)
- `examples_and_analogies` (5%)
- `learning_objectives` (5%)