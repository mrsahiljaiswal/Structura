"""Document upload API endpoints."""

from typing import List, Optional
from fastapi import APIRouter, File, UploadFile, HTTPException, Header, status

from app.schemas.document import DocumentUploadResponse
from app.services.document import get_document_service

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: Optional[UploadFile] = File(default=None),
    files: Optional[List[UploadFile]] = File(default=None),
    x_user_id: Optional[str] = Header(default="anonymous", alias="X-User-Id"),
) -> DocumentUploadResponse:
    """Upload one or multiple documents for course generation.

    Supports both 'file' and 'files' multipart form-data keys to avoid 422 errors.
    """
    uploaded_files: List[UploadFile] = []
    if file:
        uploaded_files.append(file)
    if files:
        uploaded_files.extend(files)

    if not uploaded_files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files provided in upload request.",
        )

    file_tuples = []
    for f in uploaded_files:
        if not f.filename:
            continue
        content = await f.read()
        file_tuples.append((f.filename, content))

    if not file_tuples:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded files must have valid filenames.",
        )

    try:
        service = get_document_service()
        response = service.save_batch_upload(
            files=file_tuples,
            user_id=x_user_id or "anonymous",
        )

        if response.course_id is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Course generation pipeline execution failed. Check server logs.",
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
            detail=f"Upload failed: {str(e)}",
        )


@router.post("/upload-batch", response_model=DocumentUploadResponse)
async def upload_document_batch(
    files: List[UploadFile] = File(...),
    x_user_id: Optional[str] = Header(default="anonymous", alias="X-User-Id"),
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
            user_id=x_user_id or "anonymous",
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
