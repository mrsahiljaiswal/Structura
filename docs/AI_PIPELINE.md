# 🧠 The 8-Stage NLP Document Intelligence Pipeline

The core engine of Structura is an 8-stage NLP pipeline that transforms raw PDF binary documents into structured, interactive courses.

---

## Pipeline Overview

```
[Raw PDF] ──> Stage 1: Document Normalization
              ──> Stage 2: Document Understanding (Gemini 3.1)
              ──> Stage 3: Structural Analysis
              ──> Stage 4: Knowledge Graph Extraction
              ──> Stage 5: Semantic Segmentation
              ──> Stage 6: Educational Planner (Topological Sort + Gemini 3.1)
              ──> Stage 7: Lesson Authoring (100% Verbatim + Gemini 3.1)
              ──> Stage 8: Database Persistence (PostgreSQL)
```

---

## Detailed Stage Breakdown

### Stage 1: Document Normalization (`document_normalization`)
- **Input**: Raw PDF binary byte stream.
- **Process**: Uses `PyPDF` and `PDFPlumber` to extract page text streams, removing irregular whitespace and linebreaks.
- **Output**: `NormalizedDocument(pages=[NormalizedPage(page_number, text)])`.

### Stage 2: Document Understanding (`document_understanding`)
- **Input**: Front matter (pages 1–5) and back matter (last 3 pages).
- **Process**: Prompts `gemini-3.1-flash-lite` to classify document type (`book`, `paper`, `lecture_notes`) and extract title/author metadata.
- **Output**: `DocumentProfile(document_type, title, author, language)`.

### Stage 3: Structural Analysis (`document_structure`)
- **Input**: `NormalizedDocument`.
- **Process**: Parses document heading hierarchies and section boundaries into a tree structure.
- **Output**: `DocumentStructure(tree=StructureNode(title, text, children))`.

### Stage 4: Knowledge Extraction (`knowledge_extraction`)
- **Input**: `DocumentStructure`.
- **Process**: Extracts domain concepts, definitions, and prerequisite dependencies (`Concept A -> requires -> Concept B`).
- **Output**: `KnowledgeGraph(concepts=[Concept], edges=[Relationship])`.

### Stage 5: Semantic Segmentation (`semantic_segmentation`)
- **Input**: `DocumentStructure` and `KnowledgeGraph`.
- **Process**: Groups concepts into complete **Learning Units** without character truncation caps, ensuring definitions and code blocks remain intact.
- **Output**: `LearningUnitSet(units=[LearningUnit])`.

### Stage 6: Educational Planning (`educational_planner`)
- **Input**: `KnowledgeGraph` and `LearningUnitSet`.
- **Process**: Performs a deterministic topological sort (Kahn's algorithm) on concept prerequisite edges to order learning topics logically. Prompts `gemini-3.1-flash-lite` to structure a `CoursePlan` containing Modules → Chapters → Lessons.
- **Output**: `CoursePlan(modules=[ModulePlan(chapters=[ChapterPlan(lessons=[PlannedLesson])])])`.

### Stage 7: Lesson Authoring Engine (`lesson_authoring`)
- **Input**: `PlannedLesson` and source `LearningUnit` text.
- **Process**: Prompts `gemini-3.1-flash-lite` with the **100% Verbatim Preservation Directive**. Formats complete source text into structured Markdown headings, theory, worked examples, and key takeaways with zero LLM hallucination.
- **Output**: `Lesson(title, content, examples, key_takeaways)`.

### Stage 8: Database Persistence (`api/v1/documents.py`)
- **Input**: Assembled `Course` hierarchy.
- **Process**: Commits relational `Course`, `Chapter`, and `Lesson` models into PostgreSQL using Async SQLAlchemy, returning the new `course_id`.
- **Output**: Database record commit & HTTP 200 JSON payload.

---

## Strict 100% Verbatim Preservation Directive

To eliminate LLM hallucinations, Stage 7 mandates the following prompt rule:

```
STRICT VERBATIM PRESERVATION & STRUCTURAL CATEGORIZATION DIRECTIVE:
1. Include EACH AND EVERY sentence, detail, word, code block, and formula from the PDF source text.
2. ABSOLUTELY NO TEXT OMISSION OR SHORTENING.
3. ABSOLUTELY NO NEW TEXT OR OUTSIDE GENERATION.
4. Organize and format the source text into clean Markdown headings, definitions, and takeaways.
```