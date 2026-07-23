"""Document service for handling document operations."""

import logging
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

import tempfile

logger = logging.getLogger(__name__)


class DocumentService:
    """Service for managing document operations."""
    
    UPLOADS_DIR = Path(tempfile.gettempdir()) / "structura_uploads"
    ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".pptx", ".ppt", ".txt", ".md"}
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
    
    def __init__(self):
        """Initialize the service and ensure uploads directory exists."""
        self.repository = get_document_repository()
        try:
            self.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            logger.warning(f"Could not create UPLOADS_DIR {self.UPLOADS_DIR}: {e}")
    
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
            allowed_str = ", ".join(sorted(self.ALLOWED_EXTENSIONS))
            return f"Invalid file type. Allowed formats: {allowed_str}. Got: {file_ext}"
        
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
        user_id: str = None,
    ) -> DocumentUploadResponse:
        """Save an uploaded file and create a document record.
        
        Args:
            filename: The original filename
            file_content: The file content bytes
            user_id: Optional user ID for course ownership
            
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

        import json
        # Ensure DB tables exist (dev convenience)
        try:
            logger.info("Ensuring database tables exist...")
            ensure_tables()
            logger.info("Database tables ready")
        except Exception as e:
            logger.error(f"Failed to ensure tables: {e}", exc_info=True)

        # Run consolidated Structura Pipeline
        try:
            logger.info("Starting native 10-module Structura Pipeline...")
            from app.pipeline.orchestrator import StructuraPipeline

            # Establish output directory for intermediate pipeline outputs
            artifacts_dir = self.UPLOADS_DIR / f"{metadata.document_id}_artifacts"
            artifacts_dir.mkdir(parents=True, exist_ok=True)

            # Initialize orchestrator
            pipeline = StructuraPipeline(output_dir=str(artifacts_dir))

            # Run full pipeline
            logger.info(f"Running pipeline on {file_path} with title: {filename}")
            final_course = pipeline.run(pdf_path=str(file_path), course_title=filename)

            logger.info("Persisting course structure and lessons to database...")
            course_id = persist_course_sync(metadata.document_id, metadata.stored_filename, final_course, user_id=user_id)
            logger.info(f"Course created with ID: {course_id}")

            self.repository.update_status(metadata.document_id, DocumentStatus.COURSE_GENERATED.value)
            status = DocumentStatus.COURSE_GENERATED.value

            # Extract metrics from intermediate extraction artifact
            extraction_file = artifacts_dir / "document.extracted.json"
            page_count = 0
            character_count = 0
            if extraction_file.exists():
                try:
                    with open(extraction_file, "r", encoding="utf-8") as f:
                        extracted_data = json.load(f)
                    page_count = extracted_data.get("page_count", 0)
                    for p in extracted_data.get("pages", []):
                        for b in p.get("blocks", []):
                            character_count += len(b.get("text", ""))
                except Exception as ex:
                    logger.error(f"Failed to read extracted doc details: {ex}")

        except Exception as e:
            logger.error(f"Failed to generate and persist course via Structura: {e}", exc_info=True)
            course_id = None
            page_count = 0
            character_count = 0
            status = DocumentStatus.CHUNKED.value

        return DocumentUploadResponse(
            document_id=metadata.document_id,
            filename=metadata.filename,
            page_count=page_count,
            character_count=character_count,
            status=status,
            course_id=course_id,
        )

    def save_batch_upload(
        self,
        files: list[tuple[str, bytes]],
        course_title: str | None = None,
        user_id: str = None,
    ) -> DocumentUploadResponse:
        """Save a batch of uploaded files and generate a synthesized course.
        
        Args:
            files: List of (filename, file_content) tuples
            course_title: Optional custom course title
            user_id: Optional Clerk user ID
            
        Returns:
            DocumentUploadResponse
        """
        if not files:
            raise ValueError("No files provided for batch upload.")

        saved_file_paths: list[str] = []
        source_docs_info: list[dict] = []
        primary_metadata = None

        for filename, content in files:
            error = self.validate_file(filename, len(content))
            if error:
                raise ValueError(f"File '{filename}' validation failed: {error}")

            file_id = uuid.uuid4()
            file_ext = Path(filename).suffix
            stored_filename = f"{file_id}{file_ext}"
            file_path = self.UPLOADS_DIR / stored_filename

            with open(file_path, "wb") as f:
                f.write(content)

            meta = self.repository.create(
                filename=filename,
                stored_filename=stored_filename,
                size_bytes=len(content),
            )
            if primary_metadata is None:
                primary_metadata = meta

            saved_file_paths.append(str(file_path))
            source_docs_info.append({
                "filename": filename,
                "stored_filename": stored_filename,
                "file_type": file_ext.lstrip(".").lower(),
                "size_bytes": len(content),
                "page_count": 0,
            })

        effective_title = course_title or (files[0][0] if len(files) == 1 else f"Synthesized Course ({len(files)} files)")

        try:
            ensure_tables()
            from app.pipeline.orchestrator import StructuraPipeline
            artifacts_dir = self.UPLOADS_DIR / f"{primary_metadata.document_id}_batch_artifacts"
            artifacts_dir.mkdir(parents=True, exist_ok=True)

            pipeline = StructuraPipeline(output_dir=str(artifacts_dir))
            final_course = pipeline.run_multi_document(saved_file_paths, course_title=effective_title)

            course_id = persist_course_sync(
                primary_metadata.document_id,
                primary_metadata.stored_filename,
                final_course,
                user_id=user_id,
                source_documents=source_docs_info,
            )
            self.repository.update_status(primary_metadata.document_id, DocumentStatus.COURSE_GENERATED.value)
            status = DocumentStatus.COURSE_GENERATED.value
        except Exception as e:
            logger.error(f"Batch pipeline execution failed: {e}", exc_info=True)
            course_id = None
            status = DocumentStatus.CHUNKED.value

        return DocumentUploadResponse(
            document_id=primary_metadata.document_id,
            filename=effective_title,
            page_count=len(saved_file_paths),
            character_count=0,
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
