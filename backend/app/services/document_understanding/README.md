# Module 3 — Document Understanding Engine

## Purpose
This is where intelligence begins. Answers: "What kind of document is this?"

## Input
`NormalizedDocument` (Module 2 output).

## Output
`document.profile.json` — a `DocumentProfile`:
```json
{
  "document_type": "book",
  "language": "en",
  "title": "Database Internals",
  "author": "...",
  "has_table_of_contents": true,
  "has_index": true,
  "confidence": 0.94
}
```

## Responsibilities
- Classify document_type (book, research_paper, resume, lecture_notes,
  documentation, novel, specification, slides).
- Detect language, author, publisher, edition, ISBN, title.
- Detect presence of preface, acknowledgements, copyright page, table of
  contents, index, bibliography, appendix, references.

## Must NOT do
- Build the chapter/section tree (Module 4).
- Extract concepts or knowledge (Module 5).

## Pipeline Position
Previous: Module 2 (Normalization). Next: Module 4 (Document Structure).

## Internal Workflow
1. Sample the first ~15 pages (front matter) and last ~10 pages (back
   matter) rather than the whole document, to bound LLM cost.
2. Send a single classification prompt to the model, requesting strict JSON.
3. Parse and validate `document_type` against the allowed enum.

## Error Handling
- Zero-page input -> `UnderstandingError`.
- LLM returns an invalid `document_type` or unparseable JSON ->
  `UnderstandingError` (the `LLMClient` retries once internally first).
- Confidence below 0.3 -> validator raises `UnderstandingError`, signaling
  the pipeline should flag this document for manual review.

## Configuration
- `FRONT_MATTER_PAGE_SAMPLE` / `BACK_MATTER_PAGE_SAMPLE` and character
  limits in `service.py`.
- Model comes from `LLMClient` (default `claude-sonnet-4-6`).

## Testing
`tests/test_service.py` injects a `fake_responder` into `LLMClient` so tests
run without hitting the network or needing an API key.
