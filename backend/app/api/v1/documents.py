"""Document upload API endpoints."""

from fastapi import APIRouter, File, UploadFile, HTTPException, status

from app.schemas.document import DocumentUploadResponse
from app.services.document import get_document_service

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...)) -> DocumentUploadResponse:
    """Upload a PDF document for course generation.
    
    Args:
        file: The PDF file to upload
        
    Returns:
        DocumentUploadResponse with document metadata and ID
        
    Raises:
        HTTPException: If file validation fails or upload fails
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have a filename",
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Use document service to validate and save
        service = get_document_service()
        response = service.save_upload(
            filename=file.filename,
            file_content=content,
        )
        
        if response.course_id is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Course generation pipeline execution failed. Check server logs.",
            )
            
        return response
        
    except ValueError as e:
        # File validation error
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except IOError as e:
        # File system error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}",
        )
    except Exception as e:
        # Unexpected error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during upload",
        )
