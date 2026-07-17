# Module 6 — Semantic Segmentation Engine

## Purpose
Forget character chunking - it's the wrong unit. Build Learning Units,
where one learning unit = one concept, containing everything relevant to
that concept (definition, example, explanation) as one coherent piece.

## Input
`DocumentStructure` (Module 4) + `KnowledgeGraph` (Module 5).

## Output
`learning_units.json` — a `LearningUnitSet`:
```json
{"units": [{"id": "transaction", "topic": "Transaction", "summary": "...",
            "keywords": [...], "difficulty": "beginner",
            "relationships": [], "pages": [1], "text": "..."}]}
```

## Responsibilities
- For each concept in the knowledge graph, walk back to the structural
  nodes it was extracted from (`source_node_ids`) and pull the full
  paragraph text under those nodes.
- Cap combined text at 6000 characters per unit to keep downstream lesson
  authoring prompts bounded.

## Must NOT do
- Chunk by character count independent of concept boundaries.
- Generate any new content - text here is sourced verbatim from structure,
  not paraphrased or authored.

## Pipeline Position
Previous: Module 5 (Knowledge Extraction). Next: Module 7 (Educational
Planning).

## Error Handling
- Zero concepts in the input graph -> `SegmentationError`.
- Any unit ending up with empty source text -> validator raises
  `SegmentationError` (usually means a concept's `source_node_ids` didn't
  match any node in the structure tree - a sign Modules 4/5 are out of
  sync).

## Testing
`tests/test_service.py` builds a small structure + knowledge graph and
asserts each learning unit's text contains the paragraph text from its
source section.
