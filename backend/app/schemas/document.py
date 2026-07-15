"""Request and response schemas for document operations."""

from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID


class DocumentUploadResponse(BaseModel):
    """Response returned after uploading a document."""
    
    document_id: UUID = Field(..., description="Unique document ID")
    filename: str = Field(..., description="Original filename")
    page_count: int = Field(..., description="Total number of pages extracted")
    character_count: int = Field(..., description="Total number of characters extracted")
    status: str = Field(default="TEXT_EXTRACTED", description="Document processing status")
    
    class Config:
        from_attributes = True


class DocumentMetadata(BaseModel):
    """Document metadata stored in the repository."""
    
    document_id: UUID
    filename: str
    stored_filename: str
    size_bytes: int
    upload_timestamp: datetime
    status: str = "pending"  # pending, processing, completed, failed
    error_message: Optional[str] = None
    
    class Config:
        from_attributes = True
