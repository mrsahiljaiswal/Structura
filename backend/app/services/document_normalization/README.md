# Module 2 — Document Normalization Engine

## Purpose
Transform raw extraction into clean structured content. NO AI — every rule
here is deterministic text processing.

## Input
`ExtractedDocument` (Module 1 output).

## Output
`normalized.json` — a `NormalizedDocument` with merged paragraphs, headings,
list items, and tables per page, with repeated headers/footers/page numbers
stripped out.

## Responsibilities
- Unicode, quote, and bullet normalization.
- Dehyphenate words broken across lines.
- Collapse whitespace and duplicate blank lines.
- Detect and remove headers/footers/page numbers (lines that repeat across
  >=60% of pages in the top/bottom 8% of the page).
- Merge line-level spans into paragraphs using vertical gap + font-size
  continuity heuristics.
- Classify each merged block as `heading`, `list_item`, or `paragraph`
  based on relative font size and boldness.

## Must NOT do
- Classify document type (Module 3).
- Build chapter/section hierarchy (Module 4).
- Call an LLM. This stage must be cheap and deterministic.

## Pipeline Position
Previous: Module 1 (Extraction). Next: Module 3 (Document Understanding).

## Configuration
- `LINE_Y_TOLERANCE`, `PARAGRAPH_GAP_MULTIPLIER`, `HEADER_ZONE_RATIO`,
  `FOOTER_ZONE_RATIO`, `REPEAT_THRESHOLD` in `service.py` control the
  heuristics and can be tuned per document corpus.

## Testing
`tests/test_service.py` builds a synthetic `ExtractedDocument` (heading +
paragraph + repeated footer across pages) and asserts headers/footers are
stripped and blocks are classified correctly.
