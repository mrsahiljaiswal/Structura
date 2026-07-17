# Upload and Course Generation Debugging Guide

## Changes Made

### 1. **Enhanced Logging in Backend Services**
   - Added `logging` to `document_service.py` to track PDF extraction, text cleaning, chunking, course generation, and database persistence
   - Added `logging` to `course_builder_service.py` to track database operations, table creation, and course persistence
   - Set `LOG_LEVEL=DEBUG` in `.env` for verbose output

### 2. **Improved Error Handling**
   - Modified document.py upload endpoint to capture and log detailed error messages
   - Updated frontend to display server error messages instead of generic "Upload failed" message
   - Added try-except blocks with detailed logging for each stage of the pipeline

### 3. **Fixed .env Configuration**
   - Removed duplicate configuration entries in `.env`
   - Ensured `BACKEND_CORS_ORIGINS=http://localhost:3000` is set correctly
   - Added `LOG_LEVEL=DEBUG` for better visibility

## Testing Steps

### Step 1: Verify Backend is Running
```bash
# Check if backend logs show it's started with DEBUG level
# Look for: "Starting Structura Backend [environment=local, debug=True]"
# Look for: "Application startup complete"
```

### Step 2: Test PDF Upload
1. Go to http://localhost:3000/dashboard/upload
2. Select a PDF file (must be valid PDF, < 50MB)
3. Click upload
4. Watch for these stages in the browser console and backend logs:
   - File validation
   - PDF text extraction
   - Text cleaning
   - Document chunking
   - Course outline generation
   - Lesson generation
   - Database table creation
   - Course persistence
   - Navigation to course page

### Step 3: Check Backend Logs for Each Component

The upload flow goes through these services in order:
1. **document_service.py::save_upload()** - Initial file handling
2. **document_processing_service.py::extract_text_from_pdf()** - PDF extraction
3. **text_cleaning_service.py::clean_document()** - Text cleaning
4. **chunk_service.py::chunk_document()** - Text chunking
5. **course_builder_service.py::ensure_tables()** - Create DB tables
6. **course_planner_service.py::generate_outline()** - Generate course structure
7. **lesson_generation_service.py::generate_lesson()** - Generate lesson content
8. **course_builder_service.py::persist_course_sync()** - Save to database

### Step 4: Common Issues to Check

#### Issue: Database Connection Failed
**Symptoms**: Logs show `Failed to persist course: connection error`
**Solution**:
```bash
# Verify PostgreSQL is running
# Verify credentials in .env match
# Check POSTGRES_* settings in .env file
```

#### Issue: Table Creation Failed  
**Symptoms**: Logs show `Failed to ensure tables: <error>`
**Solution**:
- Backend automatically creates tables via SQLAlchemy
- Check if PostgreSQL is accessible
- Check if database `structura` exists

#### Issue: AI Service Errors
**Symptoms**: Logs show `Failed to generate outline/lesson: <error>`
**Solution**:
- Services fall back to heuristic generation if Groq API fails
- Check if `GROQ_API_KEY` is set (can be placeholder for dev)
- Even with fallback, course should still be generated

#### Issue: Course Not Saved
**Symptoms**: Upload says "success" but `course_id` is null
**Solution**:
- Check backend logs for database persistence errors
- Verify Document record was created
- Verify Course record was created

### Step 5: Frontend Error Messages
The frontend now shows detailed error messages from the backend in the upload UI:
- Check the error text displayed on the upload widget
- This error comes directly from the backend response
- Copy the error to help debug the specific issue

## Checking Backend Logs

### Real-time Monitoring
```bash
# In the Backend terminal, you should see logs like:
# 2026-07-16T11:24:47+0530 | DEBUG | app.services.document | Starting course generation...
# 2026-07-16T11:24:47+0530 | INFO  | app.services.document | Course generated with 3 chapters
```

### Key Log Markers to Look For
- `"Ensuring database tables exist..."` - Tables being created
- `"Connecting to database: ..."` - Database connection
- `"Creating course: <title>"` - Course being created
- `"Course created with ID: <uuid>"` - Success!

## If Upload Still Fails

1. **Check browser console** (F12) for:
   - Network errors
   - CORS errors (should be fixed now)
   - Error responses from API

2. **Check backend logs** for:
   - Any of the service error logs
   - Database connection errors
   - File system errors

3. **Provide this information when asking for help**:
   - Frontend console error message
   - Backend log snippet showing the error
   - File size and type that was attempted
   - Complete error trace if available

## Next Steps After Successful Upload

1. Backend should return `course_id` in the response
2. Frontend should navigate to `/dashboard/course/{course_id}`
3. Course page should fetch and display the chapters and lessons
4. Each chapter and lesson should have the content generated from the PDF

## Database Verification

After successful upload, the database should contain:
- 1 Document record (with status="course_generated")
- 1 Course record (with title and description)
- Multiple Chapter records (usually 3-5 chapters)
- Multiple Lesson records (usually 3 lessons per chapter)
