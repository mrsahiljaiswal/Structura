# Module 1 — Document Extraction Engine

## Purpose
Convert a PDF into raw structured information. Not plain text, not lessons,
not chapters. Only extraction, with zero interpretation.

## Input
A PDF file path.

## Output
`document.extracted.json` — an `ExtractedDocument`:
```json
{
  "source_path": "book.pdf",
  "page_count": 120,
  "metadata": {"title": "...", "author": "..."},
  "pages": [
    {
      "page_number": 1,
      "width": 612.0,
      "height": 792.0,
      "blocks": [{"text": "...", "font": "Helvetica-Bold", "font_size": 18.0,
                   "bold": true, "italic": false, "bbox": {...}}],
      "images": [...],
      "tables": [...],
      "headers": [],
      "footers": []
    }
  ]
}
```

## Responsibilities
- Extract text spans with font, size, bold/italic, bounding box, and page.
- Extract raster images with position and dimensions.
- Best-effort table extraction (via pdfplumber, when installed).
- Extract document metadata (title, author, etc. as embedded in the PDF).

## Must NOT do
- Clean or normalize text (Module 2's job).
- Classify document type (Module 3's job).
- Build any hierarchy (Module 4's job).

## Pipeline Position
Input: PDF. Next: Module 2 (Document Normalization).

## Error Handling
- Missing file / unreadable PDF -> `ExtractionError`.
- Zero pages or zero text blocks after extraction -> `ExtractionError`
  (likely a scanned PDF needing OCR upstream).

## Configuration
- Table extraction is optional and degrades gracefully if `pdfplumber`
  is not installed.

## Testing
See `tests/test_service.py` — builds a small in-memory PDF with PyMuPDF
and asserts extraction picks up text, font size, and bold spans.
