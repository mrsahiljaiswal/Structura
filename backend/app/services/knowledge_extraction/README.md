# Module 5 — Knowledge Extraction Engine

## Purpose
The first major AI module. NOT lesson generation - concept extraction.
For every section: concepts, keywords, definitions, prerequisites,
difficulty, importance, and learning order (via prerequisite edges).

## Input
`DocumentStructure` (Module 4 output).

## Output
`knowledge.json` — a `KnowledgeGraph`:
```json
{
  "concepts": [{"concept_id": "acid", "name": "ACID", "keywords": [...],
                "definition": "...", "difficulty": "intermediate",
                "importance": 0.8, "prerequisites": ["Transactions"],
                "source_node_ids": [...], "pages": [12, 13]}],
  "edges": [{"source": "ACID", "relation": "requires", "target": "Transactions"}]
}
```

## Responsibilities
- Run one LLM call per `section` node (or per `chapter` if the document has
  no sections), extracting concepts local to that unit.
- Merge concepts by (slugified) name across the whole document, unioning
  keywords/prerequisites/pages and keeping the highest importance seen.
- Build `requires` edges from each concept's prerequisite list into a
  document-wide knowledge graph.

## Must NOT do
- Generate lessons (Module 8).
- Chunk text by character count (Module 6 builds proper Learning Units).

## Pipeline Position
Previous: Module 4 (Structure). Next: Module 6 (Semantic Segmentation).

## Internal Workflow
1. Collect extraction units (`_collect_units`): prefer `section`-level
   nodes; fall back to `chapter`-level if the structure is flatter.
2. Flatten each unit's paragraph text and send it to the model with a
   concept-extraction prompt, capped at 8000 characters per call.
3. Validate difficulty against the allowed enum (defaults to
   `intermediate` if the model returns something else) and clamp
   importance to [0, 1].
4. Merge and build edges.

## Error Handling
- No section/chapter content -> `KnowledgeExtractionError`.
- LLM failure for a unit -> `KnowledgeExtractionError` naming that section.
- Zero concepts overall, or an edge referencing an unknown concept name ->
  validator raises `KnowledgeExtractionError`.

## Configuration
- Per-call text cap (8000 chars) in `service.py`.
- Model via `LLMClient`.

## Testing
`tests/test_service.py` uses a `fake_responder` returning canned concept
JSON for two sections and asserts merging and edge-building behavior.
