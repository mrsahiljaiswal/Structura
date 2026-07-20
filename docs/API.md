# 📡 Structura API Endpoints Reference

All API routes are prefixed with `/api/v1`. Authenticated requests require the `X-User-Id` header (automatically attached by the Clerk Axios interceptor).

---

## Endpoint Index

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/documents/upload` | Upload PDF & generate course |
| `GET` | `/api/v1/courses` | List enrolled user courses |
| `GET` | `/api/v1/courses/{course_id}` | Get specific course details |
| `DELETE` | `/api/v1/courses/{course_id}` | Delete course & cascade delete chapters/lessons |
| `GET` | `/api/v1/lessons/{lesson_id}` | Get lesson theory & takeaways |
| `PATCH` | `/api/v1/lessons/{lesson_id}/complete` | Toggle lesson completion |
| `POST` | `/api/v1/lessons/{lesson_id}/quiz` | Generate lesson practice quiz |
| `POST` | `/api/v1/chat` | Grounded RAG Chatbot & AI Tutor |

---

## Detailed Endpoint Specifications

### 1. Upload Document & Generate Course
- **URL**: `/api/v1/documents/upload`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Parameters**: `file` (PDF File Binary, max 50MB).
- **Response**:
```json
{
  "filename": "database_systems.pdf",
  "page_count": 42,
  "character_count": 125000,
  "status": "success",
  "course_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 2. List Courses
- **URL**: `/api/v1/courses`
- **Method**: `GET`
- **Response**:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Database Systems & Indexing",
    "description": "Comprehensive course generated from PDF",
    "difficulty": "Intermediate",
    "chapters": [
      {
        "id": "ch-101",
        "title": "Introduction to B-Trees",
        "position": 1,
        "lessons": [
          {
            "id": "ls-201",
            "course_id": "550e8400-e29b-41d4-a716-446655440000",
            "title": "B-Tree Node Structures",
            "position": 1
          }
        ]
      }
    ]
  }
]
```

---

### 3. Delete Course
- **URL**: `/api/v1/courses/{course_id}`
- **Method**: `DELETE`
- **Response**: `{"status": "deleted", "course_id": "550e8400-..."}`

---

### 4. Grounded RAG Chatbot
- **URL**: `/api/v1/chat`
- **Method**: `POST`
- **Request Body**:
```json
{
  "message": "Explain B-Tree node splitting logic",
  "course_id": "550e8400-e29b-41d4-a716-446655440000",
  "knowledge_mode": "courses_only",
  "chat_history": []
}
```
- **Response**:
```json
{
  "reply": "B-Tree node splitting occurs when a leaf node exceeds maximum keys...",
  "grounding_mode": "courses_only"
}
```