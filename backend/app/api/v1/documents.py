"""Document upload API endpoints."""

from fastapi import APIRouter, File, UploadFile, HTTPException, Header, status

from app.schemas.document import DocumentUploadResponse
from app.services.document import get_document_service

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    x_user_id: str = Header(default="anonymous", alias="X-User-Id"),
) -> DocumentUploadResponse:
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
            user_id=x_user_id,
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


@router.post("/upload-batch", response_model=DocumentUploadResponse)
async def upload_document_batch(
    files: list[UploadFile] = File(...),
    x_user_id: str = Header(default="anonymous", alias="X-User-Id"),
) -> DocumentUploadResponse:
    """Upload multiple documents (PDF, DOCX, PPTX, TXT) for multi-document course synthesis."""
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one file must be provided",
        )

    file_tuples = []
    for f in files:
        if not f.filename:
            continue
        content = await f.read()
        file_tuples.append((f.filename, content))

    if not file_tuples:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded files must have valid filenames",
        )

    try:
        service = get_document_service()
        response = service.save_batch_upload(
            files=file_tuples,
            user_id=x_user_id,
        )
        if response.course_id is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Multi-document course synthesis execution failed. Check server logs.",
            )
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch upload failed: {str(e)}",
        )
