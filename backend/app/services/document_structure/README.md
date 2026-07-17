# Module 4 — Document Structure Engine

## Purpose
Build hierarchy: Book -> Chapter -> Section -> Subsection -> Paragraph.

## Input
`NormalizedDocument` (Module 2 output).

## Output
`structure.json` — a `DocumentStructure` wrapping a recursive `StructureNode`
tree.

## Responsibilities
- Cluster the distinct font sizes already flagged as `heading` in Module 2
  into up to three levels (chapter > section > subsection), largest first.
- Walk the document in reading order, attaching each heading at the right
  depth and every paragraph under the current deepest heading.
- Classify paragraph-level nodes into `definition`, `example`, `algorithm`,
  `exercise`, `warning`, `note`, `figure`, or `caption` using lightweight
  lead-in phrase matching (falls back to `content`).
- Synthesize an implicit parent node if a lower-level heading (e.g. a
  section) appears before any higher-level heading (e.g. a chapter) exists.

## Must NOT do
- Extract concepts or knowledge (Module 5).
- Call an LLM. This stage stays deterministic and typographic.

## Pipeline Position
Previous: Module 3 (Understanding). Next: Module 5 (Knowledge Extraction).

## Error Handling
- Zero pages -> `StructureError`.
- Tree with no children or zero paragraph leaves -> validator raises
  `StructureError`.

## Testing
`tests/test_service.py` builds a normalized document with two heading sizes
(chapter, section) and paragraph text, and asserts nesting depth and
`node_type` classification.
