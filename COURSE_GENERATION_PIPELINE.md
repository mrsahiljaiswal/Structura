# Course Generation Pipeline - Detailed Breakdown

## Overview Architecture

```
PDF Upload
    ↓
Text Extraction (PyMuPDF)
    ↓
Text Cleaning & Normalization
    ↓
Semantic Chunking (LangChain)
    ↓
Course Outline Generation (Groq LLM)
    ↓
Lesson Content Generation (Groq LLM)
    ↓
Database Persistence
    ↓
Frontend Display
```

---

## Stage 1: PDF Text Extraction

**Service:** `DocumentProcessingService` 
**File:** `app/services/document_processing_service.py`

### What Happens:
```
PDF File (50 MB max)
    ↓
PyMuPDF (fitz library)
    ↓
Extract text from each page
    ↓
Join all pages with "\n\n" separator
    ↓
ExtractedDocument object (raw_text)
```

### Key Operations:
```python
# Open PDF with PyMuPDF
with fitz.open(file_path) as document:
    page_count = document.page_count
    for page_number in range(page_count):
        page = document.load_page(page_number)
        text = page.get_text("text")  # Extract text
        page_texts.append(text)

raw_text = "\n\n".join(page_texts).strip()  # Combine all pages
```

### Output:
- **raw_text**: Full document text with page separators
- **pages**: List of ExtractedPage objects (preserves per-page info)
- **Statistics**: 
  - page_count
  - character_count
  - word_count

### Example Output:
```
Raw Text (concatenated pages):
"Database Internals by Alex Petrov...

[Page break]

Chapter 1: Overview...

[Page break]

Chapter 2: B-Trees..."
```

---

## Stage 2: Text Cleaning & Normalization

**Service:** `TextCleaningService`
**File:** `app/services/text_cleaning_service.py`

### Problem This Solves:
PDFs often have:
- Multiple blank lines
- Trailing spaces
- Inconsistent bullets (•, -, *, etc.)
- Smart quotes ("", '') instead of straight quotes
- Long dashes (—) instead of hyphens
- Tab characters
- Repeated page headers/footers
- Standalone page numbers

### 7-Step Cleaning Pipeline:

#### 1. **Normalize Whitespace**
```python
# BEFORE:
"Hello


World"

# AFTER:
"Hello

World"

# Regex: Replace 3+ newlines with 2 newlines
re.sub(r"\n\s*\n\s*\n+", "\n\n", text)
```

#### 2. **Remove Trailing Spaces**
```python
# Remove spaces/tabs at end of each line
text = "\n".join(line.rstrip() for line in text.split("\n"))
```

#### 3. **Normalize Bullets**
```python
# BEFORE: "- item", "* item", "• item"
# AFTER: "• item"
text = re.sub(r"^\s*[-*•]\s+", "• ", text, flags=re.MULTILINE)
```

#### 4. **Normalize Unicode**
```python
# Smart quotes → Straight quotes
text = text.replace(""", '"').replace(""", '"')
text = text.replace("'", "'").replace("'", "'")

# Long dashes → Hyphens
text = text.replace("—", "-")
text = text.replace("–", "-")

# Tab → Spaces
text = text.replace("\t", "    ")
```

#### 5. **Merge Broken Lines**
```python
# BEFORE: "This is a long sentence\nthat got\nbroken across lines"
# AFTER: "This is a long sentence that got broken across lines"
# Uses heuristics to detect mid-sentence breaks
```

#### 6. **Remove Repeated Headers**
```python
# Detects and removes repeated page headers/footers
# Common in PDFs: "Chapter 1" appearing at top of every page
```

#### 7. **Remove Page Numbers**
```python
# Removes standalone numbers like "1", "2", "3" on their own lines
text = re.sub(r"^\d+$", "", text, flags=re.MULTILINE)
```

### Output:
```python
clean_text = CleanTextInfo(
    status="COMPLETED",
    text=cleaned_full_text,  # Cleaned content
    character_count=50000,
    word_count=8000,
    cleaning_time_ms=234
)
```

### Result:
```
Cleaned Text:
"Database Internals
Overview

In this chapter, we explore the fundamental concepts of database systems.
A database is a structured collection of data stored and accessed electronically.

Key concepts:
• Indexes improve query performance
• Transactions ensure data consistency
• Replication provides fault tolerance"
```

---

## Stage 3: Semantic Chunking

**Service:** `ChunkService`
**File:** `app/services/chunk_service.py`

### Why Chunking?
- LLMs have token limits (can't process 100k-word documents at once)
- Need to maintain semantic meaning (don't split mid-sentence)
- Creates overlap for context awareness

### Chunking Strategy:

**Library:** LangChain `RecursiveCharacterTextSplitter`

```python
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1200,        # Characters per chunk
    chunk_overlap=150,      # Overlap between chunks
    length_function=len
)

chunks = splitter.split_text(cleaned_text)
```

### How It Works:
```
Original Text (8000 chars):
"Database Internals... [full text]"

After Chunking with size=1200, overlap=150:

Chunk 1 (chars 0-1200):
"Database Internals...
Overview...
[150 chars from end overlap with chunk 2]"

Chunk 2 (chars 1050-2250):
"[150 chars overlap from chunk 1]
...continued text...
[150 chars overlap with chunk 3]"

Chunk 3 (chars 2100-3300):
"[overlap]
...more text...
[overlap]"

... and so on
```

### Page Mapping:
Also tracks which original PDF pages each chunk came from:
```python
chunk_obj = ChunkContent(
    chunk_id="chunk_0001",
    chunk_index=1,
    page_start=1,      # Started on page 1
    page_end=3,        # Ended on page 3
    character_count=1200,
    text=chunk_text,
    embedding_status="PENDING",
    course_status="PENDING"
)
```

### Output:
```
List of ChunkContent objects:
[
  {chunk_0001, pages 1-3, 1200 chars},
  {chunk_0002, pages 3-5, 1200 chars},
  {chunk_0003, pages 5-7, 1200 chars},
  ...
]
```

---

## Stage 4: Course Outline Generation

**Service:** `CoursePlannerService`
**File:** `app/services/course_planner_service.py`

### Two Paths:

#### Path A: With Groq LLM (Preferred)
```
✅ GROQ_API_KEY is set
✅ document has chunks
    ↓
Extract first 400 chars from each chunk (snippets)
    ↓
Create prompt to Groq
    ↓
Groq generates outline
    ↓
Parse JSON response
    ↓
Return structured outline
```

#### Path B: Fallback Heuristic (No LLM)
```
❌ GROQ_API_KEY not set (or API error)
    ↓
Count chunks
    ↓
Calculate: chapters = min(8, max(3, chunk_count // 5))
    ↓
Generate generic structure:
    - 3-8 chapters
    - Each chapter has 3 lessons: Introduction, Key Concepts, Examples
```

### Request to Groq LLM:

```python
prompt = {
    "task": "generate_course_outline",
    "schema": {
        "title": "string",
        "description": "string",
        "difficulty": "string",  # Beginner/Intermediate/Advanced
        "chapters": [
            {"id": "int", "title": "string", "lessons": ["string"]}
        ]
    },
    "chunks": [
        "Database Internals chunk 1 (first 400 chars)...",
        "Database Internals chunk 2 (first 400 chars)...",
        "Database Internals chunk 3 (first 400 chars)...",
        # ... all chunks truncated to 400 chars
    ]
}

# Send to Groq API
POST https://api.groq.dev/v1/models/llama-3.3-70b-versatile/generate
{
    "prompt": json.dumps(prompt),
    "max_tokens": 1200
}
```

### Groq Response Example:
```json
{
    "title": "Database Internals: A Deep Dive",
    "description": "Comprehensive course on database architecture, indexing, and replication",
    "difficulty": "Intermediate",
    "chapters": [
        {
            "id": 1,
            "title": "Fundamentals",
            "lessons": ["What is a Database", "Data Models", "ACID Properties"]
        },
        {
            "id": 2,
            "title": "Indexing",
            "lessons": ["B-Trees", "Hash Indexes", "Optimization"]
        },
        {
            "id": 3,
            "title": "Replication",
            "lessons": ["Master-Slave Setup", "Consistency Models", "Failover"]
        }
    ]
}
```

### Output:
```python
outline = {
    "title": "Database Internals: A Deep Dive",
    "description": "Comprehensive course...",
    "difficulty": "Intermediate",
    "chapters": [
        {"id": 1, "title": "Chapter 1", "lessons": ["Lesson 1", "Lesson 2", "Lesson 3"]},
        {"id": 2, "title": "Chapter 2", "lessons": ["Lesson 1", "Lesson 2", "Lesson 3"]},
        ...
    ]
}
```

---

## Stage 5: Lesson Content Generation

**Service:** `LessonGenerationService`
**File:** `app/services/lesson_generation_service.py`

### Process:
For each lesson in each chapter:

```python
lesson = lesson_gen.generate_lesson(
    lesson_title="B-Trees",           # From outline
    chapter_title="Indexing",         # From outline
    chunks=chunks[start:end]          # Relevant chunks distributed per chapter
)
```

### Chunk Distribution:
```
Total chunks: 20 (from PDF)
Total chapters: 5
Chunks per chapter: 20 / 5 = 4 chunks

Chapter 1 → chunks[0:4]
Chapter 2 → chunks[4:8]
Chapter 3 → chunks[8:12]
Chapter 4 → chunks[12:16]
Chapter 5 → chunks[16:20]
```

### Request to Groq LLM:

```python
# Join all allocated chunks into context text
context_text = "\n\n".join(chunk.text for chunk in chunks)

prompt = {
    "task": "generate_lesson",
    "schema": {
        "title": "string",
        "content": "string",              # Main lesson content
        "examples": ["string"],           # Code/text examples
        "key_takeaways": ["string"],     # Bullet points
        "summary": "string"               # Brief summary
    },
    "lesson_title": "B-Trees",
    "chapter_title": "Indexing",
    "context_snippets": [context_text[:1000]]  # First 1000 chars of context
}

# Send to Groq
POST https://api.groq.dev/v1/models/llama-3.3-70b-versatile/generate
{
    "prompt": json.dumps(prompt),
    "max_tokens": 1200
}
```

### Groq Response Example:
```json
{
    "title": "B-Trees",
    "content": "B-Trees are self-balancing tree data structures commonly used for database indexing...",
    "examples": [
        "INSERT 10: Tree rebalances automatically",
        "SEARCH 5: O(log n) complexity"
    ],
    "key_takeaways": [
        "B-Trees maintain balance across insertions and deletions",
        "Fanout factor determines tree width and height",
        "Disk I/O is minimized through large node sizes"
    ],
    "summary": "B-Trees are the foundation of modern database indexing, providing..."
}
```

### Fallback (No LLM):
If Groq fails or API key missing:
```python
{
    "title": lesson_title,
    "content": context_text[:4000],        # First 4000 chars
    "examples": [],                        # Empty - no LLM
    "key_takeaways": [line1, line2, line3],  # First 3 lines
    "summary": content[:400] + "..."       # First 400 chars
}
```

### Output:
```python
lesson = {
    "title": "B-Trees",
    "content": "Full lesson content...",
    "examples": ["Example 1", "Example 2"],
    "key_takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
    "summary": "Brief summary..."
}
```

---

## Stage 6: Database Persistence

**Service:** `persist_course_sync` (in `course_builder_service.py`)

### Data Structure Created:

```
Document (from uploaded PDF)
├── Course (generated structure)
│   ├── Chapter 1
│   │   ├── Lesson 1 (content from LLM)
│   │   ├── Lesson 2 (content from LLM)
│   │   └── Lesson 3 (content from LLM)
│   ├── Chapter 2
│   │   ├── Lesson 1
│   │   ├── Lesson 2
│   │   └── Lesson 3
│   └── Chapter 3
│       └── Lesson 1-3
```

### SQL Tables:

```sql
documents
├── id (UUID): 84c3a870-aebd-4819-af66-ad38ad287d39
├── filename: "sample.pdf"
├── status: "processed"
└── ...

courses
├── id (UUID): 5606864c-8ad1-4427-b637-0ddef7e6d58c
├── document_id (FK)
├── title: "Database Internals: A Deep Dive"
├── description: "..."
├── difficulty: "Intermediate"
└── ...

chapters
├── id (Integer): 1, 2, 3, ...
├── course_id (FK)
├── title: "Fundamentals"
├── position: 1
└── ...

lessons
├── id (UUID)
├── chapter_id (FK)
├── title: "What is a Database"
├── content: "..."
├── examples: JSON array
├── key_takeaways: JSON array
├── summary: "..."
├── position: 1
└── ...
```

### Example Saved Data:

```python
# Database content after upload of "Database Internals" PDF
Document:
  id: 84c3a870-aebd-4819-af66-ad38ad287d39
  filename: ad0601af-fa84-464f-93b1-a8548861bcbe.pdf
  status: processed

Course:
  id: 5606864c-8ad1-4427-b637-0ddef7e6d58c
  document_id: 84c3a870-aebd-4819-af66-ad38ad287d39
  title: ad0601af-fa84-464f-93b1-a8548861bcbe.pdf
  description: Database Internals - A Deep Dive...
  difficulty: Intermediate

Chapters (8 total):
  Chapter 1: "Overview of Database Systems"
  Chapter 2: "Data Structures and Indexes"
  Chapter 3: "Transaction Processing"
  ...
  Chapter 8: "Scaling and Optimization"

Lessons (3 per chapter = 24 total):
  Chapter 1:
    - Lesson 1: "What is a Database System"
    - Lesson 2: "Key Concepts in Database Design"
    - Lesson 3: "Real-world Database Applications"
  Chapter 2:
    - Lesson 1: "Introduction to Indexing"
    - Lesson 2: "B-Trees and Hash Indexes"
    - Lesson 3: "Index Optimization Techniques"
  ...
```

---

## Stage 7: Frontend Display

### API Endpoint:
```
GET /api/v1/courses/{course_id}
```

### Returns:
```json
{
  "id": "5606864c-8ad1-4427-b637-0ddef7e6d58c",
  "title": "Database Internals: A Deep Dive",
  "description": "...",
  "difficulty": "Intermediate",
  "chapters": [
    {
      "id": 1,
      "title": "Fundamentals",
      "position": 1,
      "lessons": [
        {
          "id": "uuid-1",
          "title": "Introduction",
          "content": "...",
          "examples": [...],
          "key_takeaways": [...],
          "summary": "...",
          "position": 1
        },
        ...
      ]
    },
    ...
  ]
}
```

### Frontend Component:
```tsx
// Displays hierarchy:
Course Title
├── Chapter 1
│   ├── Lesson 1 (clickable - displays content)
│   ├── Lesson 2 (clickable)
│   └── Lesson 3 (clickable)
├── Chapter 2
│   └── Lesson 1-3
└── Chapter 3
    └── Lesson 1-3
```

---

## Summary Table: Who Does What

| Stage | Service | Technology | Input | Output |
|-------|---------|-----------|-------|--------|
| 1. Extract | DocumentProcessingService | PyMuPDF | PDF file | Raw text + pages |
| 2. Clean | TextCleaningService | Regex + Python | Raw text | Cleaned text |
| 3. Chunk | ChunkService | LangChain | Cleaned text | Semantic chunks (1200 chars each) |
| 4. Outline | CoursePlannerService | Groq LLM\* | Chunks | Course structure (chapters + lesson titles) |
| 5. Lessons | LessonGenerationService | Groq LLM\* | Chunks + outline | Lesson content (content, examples, takeaways) |
| 6. Persist | persist_course_sync | SQLAlchemy | Course data | Database records |
| 7. Display | FastAPI + Frontend | REST API | DB | JSON response |

\* Falls back to heuristics if Groq API unavailable

---

## LLM Configuration

### Current Setup:
```bash
# In .env file:
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_API_URL=https://api.groq.dev/v1
```

### Models Used:
- **Llama 3.3 70B** (default)
- Fast, free inference
- Good for educational content generation
- Can be swapped for other models

### Token Limits:
- **Input:** Truncated to keep total reasonable
- **Output:** max_tokens=1200 for both outline and lessons
- **Timeout:** 30 seconds per request

---

## Data Flow Example: "Database Internals.pdf"

```
1. User uploads "Database Internals.pdf" (500 pages, 2.5MB)
   ↓
2. PDFExtraction: Extract to 50,000 characters of raw text
   ↓
3. TextCleaning: Normalize whitespace, remove headers → 48,000 chars
   ↓
4. Chunking: Split into 40 chunks of 1200 chars each
   ↓
5. CoursePlanner:
   - Send 40 chunks to Groq LLM
   - Response: 
     * Title: "Database Internals: A Deep Dive"
     * 8 chapters: Fundamentals, Indexing, Transactions, etc.
     * 3 lesson titles per chapter = 24 lessons
   ↓
6. LessonGenerator:
   - For each of 24 lessons:
     * Take 4 chunks (40 chunks / 8 chapters / ? = context)
     * Send to Groq with lesson title + chapter title
     * Get: content + examples + key_takeaways + summary
   ↓
7. Persistence:
   - Create 1 Course record
   - Create 8 Chapter records
   - Create 24 Lesson records (with full content)
   - Save to PostgreSQL
   ↓
8. Frontend:
   - Navigate to /dashboard/course/{id}
   - Fetch all data via GET /api/v1/courses/{id}
   - Display tree: Course → Chapters → Lessons
   - Click lesson to read full content
```

---

## Fallback Behavior (No LLM)

If `GROQ_API_KEY` is not set or API fails:

```
1. Text Extraction: ✅ (PDF → text, no LLM needed)
2. Text Cleaning: ✅ (Regex only)
3. Chunking: ✅ (LangChain uses LLM-free splitting)
4. Course Outline: ⚠️ Heuristic fallback
   - Chapters = min(8, max(3, chunk_count // 5))
   - 8 generic chapters: "Chapter 1", "Chapter 2", ...
   - Each chapter: ["Introduction", "Key Concepts", "Examples"]
5. Lessons: ⚠️ Heuristic fallback
   - content = first N chars of chunks
   - examples = []
   - key_takeaways = first 3 lines of text
   - summary = truncated content
6. Persistence: ✅ (Same database structure)
7. Frontend: ✅ (Same display)
```

**Result:** Courses are still created, but with generic structure and less refined content.

---

## Performance Characteristics

| Operation | Time | Bottleneck |
|-----------|------|-----------|
| PDF Extraction | ~2-5 seconds | File I/O, PDF parsing |
| Text Cleaning | ~1-2 seconds | Regex operations |
| Chunking | ~500ms | LangChain splitting |
| Outline Generation | ~3-10 seconds | Groq API latency |
| Lesson Generation | ~10-30 seconds | Groq API (24 requests) |
| Database Persistence | ~1-2 seconds | SQL INSERT operations |
| **Total** | **~20-50 seconds** | **Groq LLM API** |

---

## Key Insights

1. **Pipeline is Modular**: Each stage is independent (can be replaced)
2. **LLM is Optional**: Falls back to heuristics if API unavailable
3. **No Training**: Uses off-the-shelf models (Groq), no fine-tuning
4. **Context-Aware**: Chunks preserve location in PDF (page numbers)
5. **Structured Output**: All JSON responses follow defined schemas
6. **Database-Backed**: All content persisted for later retrieval

