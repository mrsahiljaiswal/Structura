from typing import List, Optional
from pydantic import BaseModel, Field
from uuid import UUID


class LessonOut(BaseModel):
    id: UUID
    title: str
    content: Optional[str] = None
    examples: Optional[list] = None
    key_takeaways: Optional[list] = None
    summary: Optional[str] = None
    position: int

    class Config:
        from_attributes = True


class ChapterOut(BaseModel):
    id: int
    title: str
    position: int
    lessons: List[LessonOut] = []

    class Config:
        from_attributes = True


class CourseOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    difficulty: Optional[str] = None
    estimated_time: Optional[str] = None
    chapters: List[ChapterOut] = []

    class Config:
        from_attributes = True
