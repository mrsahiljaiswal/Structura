# 🗄️ PostgreSQL Database Schema Reference

Structura uses **PostgreSQL** with **Async SQLAlchemy 2.0**. Primary keys use `PG_UUID` (v4 UUIDs) for cryptographic security and URL safe identifiers. Array fields use native PostgreSQL `JSONB` columns.

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
| `filename` | `VARCHAR(255)` | `NOT NULL` | Original uploaded PDF filename |
| `stored_filename` | `VARCHAR(255)` | `NOT NULL` | Storage filename |
| `size_bytes` | `INTEGER` | `NOT NULL` | File size in bytes |
| `page_count` | `INTEGER` | `NULLABLE` | Total PDF pages |
| `uploaded_at` | `TIMESTAMP` | `DEFAULT NOW()` | Upload timestamp |
| `status` | `VARCHAR(50)` | `NOT NULL` | `processing`, `completed`, `error` |

---

### 2. `courses`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Course UUID |
| `user_id` | `VARCHAR(255)` | `NOT NULL, INDEX` | Clerk User ID owner |
| `document_id` | `UUID` | `FOREIGN KEY(documents.id)` | Source PDF document ID |
| `title` | `VARCHAR(255)` | `NOT NULL` | Course title |
| `description` | `TEXT` | `NULLABLE` | Overview summary |
| `difficulty` | `VARCHAR(50)` | `DEFAULT 'Intermediate'` | `Beginner`, `Intermediate`, `Advanced` |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | Creation timestamp |

---

### 3. `chapters`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Chapter UUID |
| `course_id` | `UUID` | `FOREIGN KEY(courses.id) ON DELETE CASCADE` | Parent course ID |
| `title` | `VARCHAR(255)` | `NOT NULL` | Chapter title |
| `position` | `INTEGER` | `NOT NULL` | Chapter sequence order |

---

### 4. `lessons`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Lesson UUID |
| `chapter_id` | `UUID` | `FOREIGN KEY(chapters.id) ON DELETE CASCADE` | Parent chapter ID |
| `title` | `VARCHAR(255)` | `NOT NULL` | Lesson title |
| `content` | `TEXT` | `NOT NULL` | Markdown theory text |
| `examples` | `JSONB` | `NULLABLE` | Worked examples array |
| `key_takeaways` | `JSONB` | `NULLABLE` | Takeaway concepts array |
| `position` | `INTEGER` | `NOT NULL` | Lesson sequence order |