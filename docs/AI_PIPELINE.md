# AI Pipeline

# Structura AI Processing Pipeline

## Overview

The AI Pipeline is the core intelligence layer of Structura.

Its responsibility is to transform an unstructured document into a structured, interactive learning experience.

Rather than simply summarizing a PDF, Structura performs multiple AI-powered processing stages to generate:

- Structured Courses
- Chapters
- Lessons
- Summaries
- Quizzes
- AI Tutor Knowledge Base

The pipeline is designed to be modular, allowing each stage to evolve independently.

---

# High-Level Pipeline

```text
                 Upload Document
                        │
                        ▼
              Document Validation
                        │
                        ▼
                PDF Text Extraction
                        │
                        ▼
                 Text Cleaning
                        │
                        ▼
                Intelligent Chunking
                        │
                        ▼
                 Generate Embeddings
                        │
                        ▼
              Store in ChromaDB
                        │
                        ▼
          AI Course Generation (Groq)
                        │
                        ▼
        Generate Chapters & Lessons
                        │
                        ▼
          Generate Chapter Quizzes
                        │
                        ▼
        Persist Course in PostgreSQL
                        │
                        ▼
               Ready for Learning
```

---

# Stage 1 — Document Upload

## Input

Supported format:

- PDF

Future support:

- DOCX
- PPTX
- Markdown

The uploaded file is stored securely and metadata is saved to PostgreSQL.

Stored metadata includes:

- Filename
- File Size
- MIME Type
- Page Count
- Upload Timestamp
- Processing Status

---

# Stage 2 — Document Validation

Before processing begins:

The system verifies:

- File type
- Maximum file size
- PDF integrity
- Read permissions

If validation fails:

Processing stops.

---

# Stage 3 — PDF Text Extraction

Library

PyMuPDF

Responsibilities

- Read every page
- Extract text
- Preserve reading order
- Remove empty pages

Output

Raw extracted document text.

---

# Stage 4 — Text Cleaning

Raw PDF text usually contains:

- Extra spaces
- Broken lines
- Page numbers
- Headers
- Footers

Cleaning includes:

- Remove unnecessary whitespace
- Merge broken sentences
- Remove duplicate headers
- Normalize formatting

Output

Clean learning content.

---

# Stage 5 — Intelligent Chunking

Large Language Models cannot process extremely large documents in a single request.

The document is divided into semantic chunks.

Strategy

Recursive Character Text Splitter

Chunk Size

1000 characters

Overlap

200 characters

Advantages

- Maintains context
- Better semantic retrieval
- Reduces hallucinations

---

# Stage 6 — Embedding Generation

Each chunk is converted into a numerical vector representation.

Purpose

Enable semantic search.

Embedding Model

BAAI/bge-small-en-v1.5

Output

Vector Embeddings

---

# Stage 7 — Vector Database

Database

ChromaDB

Stores

- Embeddings
- Chunk Metadata
- Document References

Metadata

- Document ID
- Chunk Number
- Page Number
- Source

Purpose

Fast semantic retrieval.

---

# Stage 8 — AI Course Generation

Provider

Groq

The cleaned document is analyzed to generate:

- Course Title
- Description
- Difficulty
- Learning Objectives
- Estimated Learning Time
- Prerequisites
- Table of Contents

Output

Course Metadata

---

# Stage 9 — Chapter Generation

Using the generated course outline,

AI creates

- Chapters
- Chapter Summaries
- Estimated Learning Time

Each chapter represents a logical section of the document.

---

# Stage 10 — Lesson Generation

Every chapter is expanded into lessons.

Each lesson contains:

- Explanation
- Important Notes
- Key Takeaways
- Examples
- Summary

Content is stored as Markdown.

---

# Stage 11 — Quiz Generation

For every chapter,

AI generates:

- Multiple Choice Questions
- True / False
- Short Answer Questions

Each question includes:

- Correct Answer
- Explanation
- Points

---

# Stage 12 — Database Persistence

Generated learning content is stored inside PostgreSQL.

Stored entities:

- Course
- Chapter
- Lesson
- Quiz
- Questions

This allows the course to be reopened without regenerating AI output.

---

# Stage 13 — AI Tutor

The AI Tutor uses Retrieval-Augmented Generation (RAG).

Pipeline

```text
User Question
        │
        ▼
Generate Query Embedding
        │
        ▼
Search ChromaDB
        │
        ▼
Retrieve Top Relevant Chunks
        │
        ▼
Construct Prompt
        │
        ▼
Groq LLM
        │
        ▼
Generate Response
        │
        ▼
Save Chat History
        │
        ▼
Return Response
```

Capabilities

- Answer Questions
- Explain Concepts
- Summarize Chapters
- Suggest Next Lessons
- Generate Additional Quizzes

---

# AI Prompt Strategy

Structura uses specialized prompts rather than a single generic prompt.

Prompt Categories

- Course Generation
- Lesson Generation
- Quiz Generation
- Summarization
- AI Tutor

Each prompt has a single responsibility.

---

# Error Handling

Possible failures

- Invalid PDF
- Empty PDF
- OCR Failure
- AI Timeout
- Embedding Failure
- Rate Limits

The processing status is updated accordingly.

States

- Uploaded
- Extracting
- Processing
- Completed
- Failed

---

# Future Enhancements

The pipeline is designed to support:

- OCR for scanned PDFs
- Multi-language documents
- Image understanding
- AI-generated diagrams
- Flashcards
- Mind Maps
- Audio narration
- Incremental regeneration
- Multi-model support

---

# Pipeline Design Principles

- Modular
- AI-first
- Scalable
- Recoverable
- Extensible

Every stage has a single responsibility and can be upgraded independently.

---

# Complete AI Flow

```text
User
 │
 ▼
Upload PDF
 │
 ▼
Validate Document
 │
 ▼
Extract Text
 │
 ▼
Clean Text
 │
 ▼
Chunk Content
 │
 ▼
Generate Embeddings
 │
 ▼
Store in ChromaDB
 │
 ▼
Generate Course Metadata
 │
 ▼
Generate Chapters
 │
 ▼
Generate Lessons
 │
 ▼
Generate Quizzes
 │
 ▼
Store in PostgreSQL
 │
 ▼
User Starts Learning
 │
 ▼
AI Tutor (RAG)
 │
 ▼
Continuous Learning
```

---

# Summary

Structura's AI pipeline transforms static documents into intelligent, interactive learning experiences through a sequence of extraction, semantic processing, vector indexing, AI generation, and retrieval-augmented tutoring.

The modular design ensures maintainability while enabling future enhancements without redesigning the overall architecture.