"""Document service for handling document operations."""

import uuid
from pathlib import Path
from typing import Optional

from app.repositories.document import get_document_repository
from app.schemas.document import DocumentMetadata, DocumentUploadResponse
from app.schemas.extracted_document import DocumentStatus
from app.services.document_processing_service import get_document_processing_service
from app.services.text_cleaning_service import get_text_cleaning_service
from app.services.chunk_service import get_chunk_service
from app.services.course_planner_service import get_course_planner_service
from app.services.lesson_generation_service import get_lesson_generation_service
from app.services.course_builder_service import persist_course_sync, ensure_tables


class DocumentService:
    """Service for managing document operations."""
    
    UPLOADS_DIR = Path("uploads")
    ALLOWED_EXTENSIONS = {".pdf"}
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
    
    def __init__(self):
        """Initialize the service and ensure uploads directory exists."""
        self.repository = get_document_repository()
        self.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    
    def validate_file(self, filename: str, file_size: int) -> Optional[str]:
        """Validate a file before processing.
        
        Args:
            filename: The original filename
            file_size: The file size in bytes
            
        Returns:
            Error message if validation fails, None if valid
        """
        # Check file extension
        file_ext = Path(filename).suffix.lower()
        if file_ext not in self.ALLOWED_EXTENSIONS:
            return f"Invalid file type. Only PDF files are allowed. Got: {file_ext}"
        
        # Check file size
        if file_size > self.MAX_FILE_SIZE:
            max_mb = self.MAX_FILE_SIZE / (1024 * 1024)
            actual_mb = file_size / (1024 * 1024)
            return f"File too large. Maximum {max_mb}MB allowed. Got: {actual_mb:.2f}MB"
        
        return None
    
    def save_upload(
        self,
        filename: str,
        file_content: bytes,
    ) -> DocumentUploadResponse:
        """Save an uploaded file and create a document record.
        
        Args:
            filename: The original filename
            file_content: The file content bytes
            
        Returns:
            DocumentUploadResponse with document metadata
            
        Raises:
            ValueError: If validation fails
        """
        # Validate
        error = self.validate_file(filename, len(file_content))
        if error:
            raise ValueError(error)
        
        # Generate unique filename
        file_id = uuid.uuid4()
        file_ext = Path(filename).suffix
        stored_filename = f"{file_id}{file_ext}"
        
        # Save file to disk
        file_path = self.UPLOADS_DIR / stored_filename
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Create document record in repository
        metadata = self.repository.create(
            filename=filename,
            stored_filename=stored_filename,
            size_bytes=len(file_content),
        )

        # Extract PDF text immediately after saving the file.
        processing_service = get_document_processing_service()
        extracted_document = processing_service.extract_text_from_pdf(
            file_path=file_path,
            document_id=f"doc_{metadata.document_id}",
            original_filename=filename,
            uploaded_at=metadata.upload_timestamp,
        )

        # Clean the extracted text and write cleaned output files.
        cleaned_document = get_text_cleaning_service().clean_document(extracted_document)

        # Run chunking step (semantic chunk generation)
        chunked_document = get_chunk_service().chunk_document(cleaned_document)

        # Mark document ready for next stage.
        self.repository.update_status(metadata.document_id, DocumentStatus.CHUNKED.value)

        # Ensure DB tables exist (dev convenience)
        try:
            ensure_tables()
        except Exception:
            pass

        # Generate course outline + lessons (use planner + lesson generator)
        planner = get_course_planner_service()
        lesson_gen = get_lesson_generation_service()

        outline = planner.generate_outline(chunked_document)

        # attach lessons per chapter
        course = {
            "title": outline.get("title"),
            "description": outline.get("description"),
            "difficulty": outline.get("difficulty", "Intermediate"),
            "chapters": [],
        }

        chunks = getattr(chunked_document, "chunks", []) or []
        chapters = outline.get("chapters", [])
        chunks_per_chapter = max(1, len(chunks) // max(1, len(chapters)))

        for ci, ch in enumerate(chapters):
            start = ci * chunks_per_chapter
            end = start + chunks_per_chapter
            relevant = chunks[start:end]
            lessons_out = []
            for lesson_title in ch.get("lessons", []):
                lesson = lesson_gen.generate_lesson(lesson_title, ch.get("title"), relevant)
                lessons_out.append(lesson)
            course["chapters"].append({"title": ch.get("title"), "lessons": lessons_out})

        # Persist course to DB
        try:
            course_id = persist_course_sync(metadata.document_id, metadata.stored_filename, course)
            self.repository.update_status(metadata.document_id, DocumentStatus.COURSE_GENERATED.value)
            status = DocumentStatus.COURSE_GENERATED.value
        except Exception:
            course_id = None
            status = DocumentStatus.CHUNKED.value

        return DocumentUploadResponse(
            document_id=metadata.document_id,
            filename=metadata.filename,
            page_count=chunked_document.document.page_count,
            character_count=chunked_document.document.character_count,
            status=status,
            course_id=course_id,
        )
    
    def get_document(self, document_id: str) -> Optional[DocumentMetadata]:
        """Retrieve a document by ID.
        
        Args:
            document_id: The document UUID as string
            
        Returns:
            DocumentMetadata or None if not found
        """
        try:
            doc_uuid = uuid.UUID(document_id)
            return self.repository.get(doc_uuid)
        except ValueError:
            return None
    
    def get_file_path(self, document_id: str) -> Optional[Path]:
        """Get the file path for a document.
        
        Args:
            document_id: The document UUID as string
            
        Returns:
            Path to the file or None if document not found
        """
        metadata = self.get_document(document_id)
        if not metadata:
            return None
        return self.UPLOADS_DIR / metadata.stored_filename


# Global service instance
_service_instance: Optional[DocumentService] = None


def get_document_service() -> DocumentService:
    """Get or create the global document service instance."""
    global _service_instance
    if _service_instance is None:
        _service_instance = DocumentService()
    return _service_instance
