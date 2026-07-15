from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional


class DocumentStatus(str, Enum):
    """Pipeline status representing document processing stages."""

    UPLOADED = "UPLOADED"
    TEXT_EXTRACTED = "TEXT_EXTRACTED"
    TEXT_CLEANED = "TEXT_CLEANED"
    CHUNKED = "CHUNKED"
    EMBEDDED = "EMBEDDED"
    COURSE_GENERATED = "COURSE_GENERATED"
    QUIZ_GENERATED = "QUIZ_GENERATED"
    READY = "READY"


class DocumentMetadata(BaseModel):
    """Metadata for an extracted document."""

    id: str = Field(..., description="Document identifier")
    filename: str = Field(..., description="Stored filename")
    original_filename: str = Field(..., description="Original uploaded filename")

    file_path: str = Field(..., description="Path to the stored PDF file")
    file_size: int = Field(..., description="Size of the file in bytes")
    mime_type: str = Field(..., description="MIME type of the file")

    page_count: int = Field(..., description="Total number of pages")
    character_count: int = Field(..., description="Total character count")
    word_count: int = Field(..., description="Total word count")

    status: DocumentStatus = Field(..., description="Document processing status")

    uploaded_at: datetime = Field(..., description="Upload timestamp")
    processed_at: datetime = Field(..., description="Processing timestamp")

    class Config:
        from_attributes = True
        use_enum_values = False


class ExtractionMetadata(BaseModel):
    """Metadata about the extraction process."""

    library: str = Field(..., description="Extraction library name")
    version: str = Field(..., description="Extraction library version")
    language: str = Field(..., description="Detected language or placeholder")
    extraction_time_ms: int = Field(..., description="Extraction duration in milliseconds")

    class Config:
        from_attributes = True


class ProcessingInfo(BaseModel):
    """Current processing state and progress tracking."""

    current_stage: DocumentStatus = Field(..., description="Current pipeline stage")
    progress: int = Field(..., description="Progress percentage (0-100)")
    next_stage: Optional[DocumentStatus] = Field(None, description="Next pipeline stage")

    class Config:
        from_attributes = True
        use_enum_values = False


class Statistics(BaseModel):
    """Document statistics for analytics."""

    paragraphs: int = Field(0, description="Estimated paragraph count")
    headings: int = Field(0, description="Estimated heading count")
    tables: int = Field(0, description="Estimated table count")
    images: int = Field(0, description="Estimated image count")
    estimated_reading_time: int = Field(0, description="Estimated reading time in minutes")

    class Config:
        from_attributes = True


class ExtractedPage(BaseModel):
    """Extracted text for a single page."""

    page_number: int = Field(..., description="Page number starting at 1")
    text: str = Field(..., description="Extracted page text")

    class Config:
        from_attributes = True


class ChunkContent(BaseModel):
    """A chunk of text ready for embedding and processing."""

    chunk_id: str = Field(..., description="Unique chunk identifier")
    chunk_index: int = Field(..., description="Chunk sequence index")
    page_start: int = Field(..., description="Starting page number")
    page_end: int = Field(..., description="Ending page number")
    character_count: int = Field(..., description="Character count of the chunk")
    text: str = Field(..., description="Chunk text content")
    embedding_status: str = Field("PENDING", description="Embedding status")
    course_status: str = Field("PENDING", description="Course generation status")

    class Config:
        from_attributes = True


class CleanTextInfo(BaseModel):
    """Cleaned text with processing status."""
    status: str = Field("PENDING", description="Cleaning status")
    text: Optional[str] = Field(None, description="Cleaned text content")
    character_count: Optional[int] = Field(None, description="Character count of cleaned text")
    word_count: Optional[int] = Field(None, description="Word count of cleaned text")
    cleaning_time_ms: Optional[int] = Field(None, description="Time taken to clean in milliseconds")
    class Config:
        from_attributes = True


class EmbeddingInfo(BaseModel):
    """Embedding storage and metadata."""

    status: str = Field("PENDING", description="Embedding generation status")
    vector: Optional[list[float]] = Field(None, description="Embedding vector")
    model: Optional[str] = Field(None, description="Embedding model used")

    class Config:
        from_attributes = True


class ExtractedDocument(BaseModel):
    """Structured extracted document for the complete processing pipeline."""

    document: DocumentMetadata = Field(..., description="Document-level metadata")
    extraction: ExtractionMetadata = Field(..., description="Extraction metadata")
    processing: ProcessingInfo = Field(..., description="Processing state and progress")
    statistics: Statistics = Field(..., description="Document statistics")
    pages: list[ExtractedPage] = Field(..., description="List of extracted pages")
    raw_text: str = Field(..., description="Concatenated raw text of the document")
    clean_text: CleanTextInfo = Field(..., description="Cleaned text with status")
    chunks: list[ChunkContent] = Field(default_factory=list, description="Text chunks")
    embeddings: EmbeddingInfo = Field(..., description="Embedding information")

    class Config:
        from_attributes = True
        use_enum_values = False
