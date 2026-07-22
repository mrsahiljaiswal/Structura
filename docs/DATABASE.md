# 🗄️ PostgreSQL Database Schema Reference

Structura uses **PostgreSQL** with **Async SQLAlchemy 2.0**. Primary keys use `PG_UUID` (v4 UUIDs) or integers, and array/nested data fields use native PostgreSQL `JSONB` columns.

---

## Entity Relationship Diagram (ERD)

```
┌─────────────────┐       1:N       ┌─────────────────┐
│    documents    ├─────────────────┤     courses     │
└─────────────────┘                 └────────┬────────┘
                                             │ 1:N (ON DELETE CASCADE)
                                             ▼
                                    ┌─────────────────┐
                                    │    chapters     │
                                    └────────┬────────┘
                                             │ 1:N (ON DELETE CASCADE)
                                             ▼
                                    ┌─────────────────┐
                                    │     lessons     │
                                    └─────────────────┘
```

---

## Database Tables

### 1. `documents`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Cryptographic v4 UUID |
| `filename` | `VARCHAR(512)` | `NOT NULL` | Original uploaded PDF filename |
| `stored_filename` | `VARCHAR(512)` | `NOT NULL` | Storage filename on server |
| `size_bytes` | `INTEGER` | `NOT NULL` | File size in bytes |
| `uploaded_at` | `TIMESTAMP` | `DEFAULT NOW()` | Ingestion timestamp |
| `status` | `VARCHAR(64)` | `DEFAULT 'pending'` | Processing status (`pending`, `completed`, `error`) |

---

### 2. `courses`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Course UUID |
| `user_id` | `VARCHAR(255)` | `NULLABLE, INDEX` | Clerk User ID owner |
| `document_id` | `UUID` | `FOREIGN KEY(documents.id)` | Source PDF document ID |
| `title` | `VARCHAR(1024)` | `NOT NULL` | Course title |
| `description` | `TEXT` | `NULLABLE` | Overview summary |
| `difficulty` | `VARCHAR(64)` | `NULLABLE` | `Beginner`, `Intermediate`, `Advanced` |
| `estimated_time` | `VARCHAR(64)` | `NULLABLE` | Dynamic estimated duration label |

---

### 3. `chapters`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY` | Auto-incrementing Chapter ID |
| `course_id` | `UUID` | `FOREIGN KEY(courses.id) ON DELETE CASCADE` | Parent course ID |
| `title` | `VARCHAR(1024)` | `NOT NULL` | Chapter title |
| `position` | `INTEGER` | `DEFAULT 0` | Chapter sequence order |

---

### 4. `lessons`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Lesson UUID |
| `chapter_id` | `INTEGER` | `FOREIGN KEY(chapters.id) ON DELETE CASCADE` | Parent chapter ID |
| `title` | `VARCHAR(1024)` | `NOT NULL` | Lesson title |
| `content` | `TEXT` | `NULLABLE` | Compiled Markdown theory, definitions, analogies, and takeaways |
| `examples` | `JSONB` | `NULLABLE` | Array of worked examples |
| `key_takeaways` | `JSONB` | `NULLABLE` | Array of key concept takeaways |
| `summary` | `TEXT` | `NULLABLE` | Lesson summary text |
| `is_completed` | `INTEGER` | `DEFAULT 0` | Completed state indicator (0 = uncompleted, 1 = completed) |
| `position` | `INTEGER` | `DEFAULT 0` | Lesson sequence order |

---

### 5. `user_progress`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | `VARCHAR(255)` | `PRIMARY KEY` | Clerk User ID |
| `pinned_courses` | `JSONB` | `NOT NULL, DEFAULT []` | Pinned course UUIDs array |
| `favorite_courses` | `JSONB` | `NOT NULL, DEFAULT []` | Favorited course UUIDs array |
| `completed_lessons` | `JSONB` | `NOT NULL, DEFAULT []` | Completed lesson UUIDs array |
| `study_time_total` | `INTEGER` | `DEFAULT 0` | Cumulative study duration in seconds |
| `study_time_by_day` | `JSONB` | `NOT NULL, DEFAULT {}` | Daily study time analytics mapping (`YYYY-MM-DD -> seconds`) |
| `quiz_scores` | `JSONB` | `NOT NULL, DEFAULT {}` | Quiz score records mapping (`lesson_id -> scores_array`) |
| `lesson_notes` | `JSONB` | `NOT NULL, DEFAULT {}` | User-edited lesson notes mapping (`lesson_id -> markdown_text`) |
| `streak_count` | `INTEGER` | `DEFAULT 0` | Consecutive days active count |
| `streak_last_date` | `VARCHAR(64)` | `NULLABLE` | Timestamp string of last active day |
| `chat_history` | `JSONB` | `NOT NULL, DEFAULT []` | User-tutor chat dialogue JSON records array |