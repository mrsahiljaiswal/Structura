# Database Design

# Structura Database Schema

This document defines the relational database design for Structura.

The database is designed around the learning lifecycle:

User → Document → Course → Chapter → Lesson → Progress

The schema is normalized, scalable, and supports future features without major redesign.

---

# Entity Relationship Diagram

```text
User
│
├── Documents
│      │
│      └── Course
│              │
│              ├── Chapters
│              │      │
│              │      ├── Lessons
│              │      │
│              │      └── Quiz
│              │              │
│              │              └── Quiz Questions
│              │
│              └── Chat Sessions
│                      │
│                      └── Chat Messages
│
└── Lesson Progress
```

---

# Common Fields

Every table contains:

- id (UUID)
- created_at
- updated_at

UUIDs are used to improve security and API scalability.

---

# 1. User

Stores authenticated users.

| Column | Type |
|----------|------|
| id | UUID |
| clerk_id | String |
| email | String |
| name | String |
| avatar_url | String |
| created_at | Timestamp |
| updated_at | Timestamp |

---

# 2. Document

Represents the original uploaded file.

| Column | Type |
|----------|------|
| id | UUID |
| user_id | UUID |
| title | String |
| original_filename | String |
| storage_path | String |
| mime_type | String |
| file_size | Integer |
| page_count | Integer |
| processing_status | Enum |
| uploaded_at | Timestamp |
| created_at | Timestamp |
| updated_at | Timestamp |

Processing Status

- Uploaded
- Extracting
- Processing
- Completed
- Failed

---

# 3. Course

AI-generated course created from a document.

| Column | Type |
|----------|------|
| id | UUID |
| document_id | UUID |
| title | String |
| description | Text |
| difficulty | Enum |
| estimated_minutes | Integer |
| learning_objectives | JSON |
| prerequisites | JSON |
| language | String |
| ai_model | String |
| generation_time_seconds | Integer |
| generated_at | Timestamp |
| created_at | Timestamp |
| updated_at | Timestamp |

---

# 4. Chapter

Course is divided into chapters.

| Column | Type |
|----------|------|
| id | UUID |
| course_id | UUID |
| chapter_number | Integer |
| title | String |
| summary | Text |
| estimated_minutes | Integer |
| created_at | Timestamp |
| updated_at | Timestamp |

---

# 5. Lesson

Each chapter contains multiple lessons.

| Column | Type |
|----------|------|
| id | UUID |
| chapter_id | UUID |
| lesson_number | Integer |
| title | String |
| content | Markdown |
| key_takeaways | JSON |
| important_notes | JSON |
| examples | JSON |
| estimated_minutes | Integer |
| created_at | Timestamp |
| updated_at | Timestamp |

---

# 6. Lesson Progress

Tracks learning progress for every user.

| Column | Type |
|----------|------|
| id | UUID |
| user_id | UUID |
| lesson_id | UUID |
| completed | Boolean |
| completed_at | Timestamp |
| time_spent_seconds | Integer |
| last_position | Integer |
| updated_at | Timestamp |

---

# 7. Quiz

Each chapter has one quiz.

| Column | Type |
|----------|------|
| id | UUID |
| chapter_id | UUID |
| title | String |
| created_at | Timestamp |

---

# 8. Quiz Question

Stores AI-generated questions.

| Column | Type |
|----------|------|
| id | UUID |
| quiz_id | UUID |
| question | Text |
| type | Enum |
| options | JSON |
| correct_answer | Text |
| explanation | Text |
| points | Integer |

Question Types

- MCQ
- True/False
- Short Answer

---

# 9. Quiz Attempt

Stores quiz results.

| Column | Type |
|----------|------|
| id | UUID |
| user_id | UUID |
| quiz_id | UUID |
| score | Integer |
| total_questions | Integer |
| submitted_at | Timestamp |

---

# 10. Chat Session

Represents one AI conversation.

| Column | Type |
|----------|------|
| id | UUID |
| course_id | UUID |
| user_id | UUID |
| title | String |
| created_at | Timestamp |
| updated_at | Timestamp |

---

# 11. Chat Message

Stores individual chat messages.

| Column | Type |
|----------|------|
| id | UUID |
| session_id | UUID |
| role | Enum |
| message | Text |
| created_at | Timestamp |

Roles

- User
- Assistant

---

# Design Principles

- UUID primary keys
- Normalized relationships
- Separate input (Document) from generated output (Course)
- Markdown for lesson content
- JSON fields for flexible AI-generated data
- Chapter-level quizzes
- Persistent learning progress
- Persistent AI chat history
- Ready for future document formats (DOCX, PPTX, Markdown)

---

# Future Extensions

The schema can easily support:

- Flashcards
- Mind Maps
- Certificates
- Audio Narration
- Semantic Search
- Team Workspaces
- Multi-language Courses
- Versioned Course Regeneration

without requiring major database redesign.