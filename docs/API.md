# API Specification

# Structura REST API

## Overview

Structura follows a RESTful API architecture.

All endpoints are versioned under:

```
/api/v1
```

The API is organized into resource-based modules.

---

# Authentication

Authentication is handled using **Clerk**.

Every protected request includes:

```
Authorization: Bearer <JWT_TOKEN>
```

The backend validates the Clerk JWT before processing requests.

---

# Standard Response Format

## Success

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

---

## Error

```json
{
  "success": false,
  "message": "Resource not found.",
  "errors": []
}
```

---

# Health

## GET /health

Returns server health.

Response

```json
{
    "status": "healthy"
}
```

---

# Authentication

## GET /me

Returns the authenticated user.

Authentication Required

✅ Yes

---

# Documents

## POST /documents/upload

Upload a PDF.

Authentication

✅ Required

Request

Multipart Form

```
file
```

Response

```json
{
    "document_id":"uuid",
    "status":"uploaded"
}
```

---

## GET /documents

Returns all uploaded documents.

---

## GET /documents/{documentId}

Returns a document.

---

## DELETE /documents/{documentId}

Delete document.

---

# Course

## POST /courses/generate/{documentId}

Generate AI Course.

Authentication

Required

Response

```json
{
    "course_id":"uuid",
    "status":"processing"
}
```

---

## GET /courses

Returns all courses.

---

## GET /courses/{courseId}

Returns complete course.

Includes

- metadata

- chapters

- progress

---

# Chapters

## GET /courses/{courseId}/chapters

Returns all chapters.

---

## GET /chapters/{chapterId}

Returns

- chapter

- lessons

---

# Lessons

## GET /lessons/{lessonId}

Returns lesson.

---

## POST /lessons/{lessonId}/complete

Marks lesson completed.

Request

```json
{
    "time_spent_seconds":120
}
```

---

## GET /courses/{courseId}/progress

Returns

```json
{
    "completion":72
}
```

---

# Quiz

## GET /chapters/{chapterId}/quiz

Returns quiz.

---

## POST /quizzes/{quizId}/submit

Submit answers.

Response

```json
{
    "score":8,
    "total":10
}
```

---

## GET /quizzes/history

Quiz history.

---

# AI Tutor

## POST /chat

Send message.

Request

```json
{
    "course_id":"uuid",
    "message":"Explain transformers."
}
```

Response

```json
{
    "response":"..."
}
```

---

## GET /chat/{courseId}

Returns chat history.

---

# Dashboard

## GET /dashboard

Returns

- Courses

- Progress

- Recent Learning

- Quiz Scores

- Learning Statistics

---

# Search

## GET /search

Query

```
?q=machine learning
```

Searches

- Courses

- Chapters

- Lessons

---

# Profile

## GET /profile

Returns profile.

---

## PATCH /profile

Update profile.

---

# Status Codes

| Code | Meaning |
|------|----------|
|200|Success|
|201|Created|
|204|Deleted|
|400|Bad Request|
|401|Unauthorized|
|403|Forbidden|
|404|Not Found|
|422|Validation Error|
|429|Rate Limited|
|500|Internal Server Error|

---

# API Modules

```
Authentication

↓

Users

↓

Documents

↓

Courses

↓

Lessons

↓

Quiz

↓

Chat

↓

Dashboard

↓

Search
```

---

# Endpoint Summary

| Module | Endpoints |
|---------|------------|
|Authentication|1|
|Documents|4|
|Courses|3|
|Chapters|2|
|Lessons|3|
|Quiz|3|
|Chat|2|
|Dashboard|1|
|Search|1|
|Profile|2|

Total Endpoints

≈22 REST APIs

---

# Future APIs

Future versions may include

- Flashcards

- Mind Maps

- Audio Narration

- Course Export

- Course Sharing

- Team Workspaces

without breaking existing API contracts.

---

# API Design Principles

- RESTful

- Stateless

- Resource-oriented

- Versioned

- JWT Authentication

- Consistent Responses

- Proper HTTP Status Codes

- Scalable

- AI-first

---

# Summary

Structura exposes a modular REST API that separates authentication, document processing, learning content, AI interactions, quizzes, search, and analytics into independent resource groups. This design keeps the backend maintainable while allowing future expansion without breaking existing clients.