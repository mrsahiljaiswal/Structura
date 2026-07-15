"""In-memory document repository for development.

This repository stores documents in memory. It's designed to be easily replaced
with a SQLAlchemy-based repository without changing the API layer.
"""

from typing import Dict, Optional
from uuid import UUID
import uuid
from datetime import datetime

from app.schemas.document import DocumentMetadata


class DocumentRepository:
    """In-memory document repository."""
    
    def __init__(self):
        """Initialize the repository with an empty documents store."""
        self._documents: Dict[UUID, DocumentMetadata] = {}
    
    def create(
        self,
        filename: str,
        stored_filename: str,
        size_bytes: int,
    ) -> DocumentMetadata:
        """Create and store a new document.
        
        Args:
            filename: Original filename
            stored_filename: Stored filename (typically with UUID)
            size_bytes: File size in bytes
            
        Returns:
            DocumentMetadata: The created document
        """
        document_id = uuid.uuid4()
        metadata = DocumentMetadata(
            document_id=document_id,
            filename=filename,
            stored_filename=stored_filename,
            size_bytes=size_bytes,
            upload_timestamp=datetime.utcnow(),
            status="pending",
        )
        self._documents[document_id] = metadata
        return metadata
    
    def get(self, document_id: UUID) -> Optional[DocumentMetadata]:
        """Retrieve a document by ID.
        
        Args:
            document_id: The UUID of the document
            
        Returns:
            DocumentMetadata or None if not found
        """
        return self._documents.get(document_id)
    
    def update_status(
        self,
        document_id: UUID,
        status: str,
        error_message: Optional[str] = None,
    ) -> Optional[DocumentMetadata]:
        """Update the processing status of a document.
        
        Args:
            document_id: The UUID of the document
            status: New status (pending, processing, completed, failed)
            error_message: Optional error message if status is failed
            
        Returns:
            Updated DocumentMetadata or None if not found
        """
        if document_id not in self._documents:
            return None
        
        metadata = self._documents[document_id]
        metadata.status = status
        metadata.error_message = error_message
        return metadata
    
    def list_all(self) -> list[DocumentMetadata]:
        """List all documents.
        
        Returns:
            List of all document metadata
        """
        return list(self._documents.values())


# Global repository instance (would be injected in production)
_repository_instance: Optional[DocumentRepository] = None


def get_document_repository() -> DocumentRepository:
    """Get or create the global document repository instance."""
    global _repository_instance
    if _repository_instance is None:
        _repository_instance = DocumentRepository()
    return _repository_instance
