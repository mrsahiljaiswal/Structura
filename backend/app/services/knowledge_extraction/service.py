from __future__ import annotations

import re

from app.common.exceptions import LLMError
from app.common.llm_client import LLMClient
from app.services.document_structure.schema import DocumentStructure, StructureNode

from .exceptions import KnowledgeExtractionError
from .schema import Concept, KnowledgeEdge, KnowledgeGraph

from app.prompts.modules.knowledge_extraction.system import build_knowledge_extraction_system_prompt, VALID_DIFFICULTIES
from app.prompts.modules.knowledge_extraction.user import build_knowledge_extraction_user_prompt
from app.prompts.registry import get_prompt_version


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.strip().lower()).strip("-")


class KnowledgeExtractionService:
    """
    Module 5: Knowledge Extraction Engine. First major AI module.

    Runs concept extraction independently per structural unit (section, or
    chapter if the document has no sections), then merges concepts by name
    across the whole document into one KnowledgeGraph with prerequisite
    edges. Does NOT generate lessons - that's Module 8.
    """

    def __init__(self, llm_client: LLMClient | None = None):
        self.llm = llm_client or LLMClient()
        self._system_prompt = build_knowledge_extraction_system_prompt()

    def extract(self, structure: DocumentStructure) -> KnowledgeGraph:
        units = self._collect_units(structure.tree)
        if not units:
            raise KnowledgeExtractionError("No section-level content found to extract concepts from.")

        concepts_by_slug: dict[str, Concept] = {}

        # Batch key units into a single 1-call prompt (< 2500 chars / 600 tokens total)
        sampled_parts = []
        for unit in units[:6]:
            txt = self._unit_text(unit).strip()
            if txt:
                title = unit.title or unit.node_id
                sampled_parts.append(f"Section [{title}]: {txt[:400]}")

        # Extract concepts across all document sections/chapters
        for unit in units:
            txt = self._unit_text(unit).strip()
            if not txt:
                continue
            title = unit.title or unit.node_id
            raw_concepts = self._extract_for_unit(title, txt[:3000])
            for raw in raw_concepts:
                self._merge_concept(concepts_by_slug, raw, unit)

        # Fallback for documents with very few or unsectioned text blocks
        if len(concepts_by_slug) < 3:
            all_text_parts = [f"Section [{u.title or u.node_id}]: {self._unit_text(u).strip()[:500]}" for u in units]
            combined_text = "\n\n".join(all_text_parts)[:4000]
            if combined_text:
                fallback_concepts = self._extract_for_unit("Full Document Concepts Overview", combined_text)
                primary_unit = units[0] if units else StructureNode(node_id="root", level="doc")
                for raw in fallback_concepts:
                    self._merge_concept(concepts_by_slug, raw, primary_unit)

        edges = self._build_edges(concepts_by_slug)
        return KnowledgeGraph(concepts=list(concepts_by_slug.values()), edges=edges)

    # -- unit collection ------------------------------------------------------

    @staticmethod
    def _collect_units(node: StructureNode) -> list[StructureNode]:
        """Prefer 'section' nodes; fall back to 'chapter' nodes if there are no sections."""
        sections = []
        chapters = []

        def walk(n: StructureNode):
            if n.level == "section":
                sections.append(n)
            if n.level == "chapter":
                chapters.append(n)
            for c in n.children:
                walk(c)

        walk(node)
        return sections if sections else chapters

    @staticmethod
    def _unit_text(node: StructureNode) -> str:
        parts = []

        def walk(n: StructureNode):
            if n.level == "paragraph" and n.text:
                parts.append(n.text)
            for c in n.children:
                walk(c)

        walk(node)
        return "\n".join(parts)

    # -- LLM call ---------------------------------------------------------------

    def _extract_for_unit(self, unit_title: str, text: str) -> list[dict]:
        user_prompt = build_knowledge_extraction_user_prompt(unit_title=unit_title, text=text)
        try:
            data = self.llm.complete_json(self._system_prompt, user_prompt)
        except LLMError as e:
            raise KnowledgeExtractionError(f"Concept extraction failed for section '{unit_title}': {e}") from e

        concepts = data.get("concepts", []) if isinstance(data, dict) else []
        valid = []
        for c in concepts:
            if not c.get("name"):
                continue
            if c.get("difficulty") not in VALID_DIFFICULTIES:
                c["difficulty"] = "intermediate"
            c["importance"] = max(0.0, min(1.0, float(c.get("importance", 0.5))))
            valid.append(c)
        return valid

    # -- merging ------------------------------------------------------------

    @staticmethod
    def _merge_concept(bucket: dict[str, Concept], raw: dict, unit: StructureNode) -> None:
        slug = _slug(raw["name"])
        pages = list(range(unit.page_start, unit.page_end + 1))
        if slug in bucket:
            existing = bucket[slug]
            existing.keywords = sorted(set(existing.keywords) | set(raw.get("keywords", [])))
            existing.prerequisites = sorted(set(existing.prerequisites) | set(raw.get("prerequisites", [])))
            existing.importance = max(existing.importance, raw["importance"])
            existing.definition = existing.definition or raw.get("definition")
            existing.source_node_ids = sorted(set(existing.source_node_ids) | {unit.node_id})
            existing.pages = sorted(set(existing.pages) | set(pages))
        else:
            bucket[slug] = Concept(
                concept_id=slug,
                name=raw["name"],
                keywords=sorted(set(raw.get("keywords", []))),
                definition=raw.get("definition"),
                difficulty=raw["difficulty"],
                importance=raw["importance"],
                prerequisites=sorted(set(raw.get("prerequisites", []))),
                source_node_ids=[unit.node_id],
                pages=pages,
            )

    @staticmethod
    def _build_edges(bucket: dict[str, Concept]) -> list[KnowledgeEdge]:
        edges = []
        names_by_slug = {c.concept_id: c.name for c in bucket.values()}
        slug_by_name = {name.lower(): slug for slug, name in names_by_slug.items()}
        for concept in bucket.values():
            for prereq_name in concept.prerequisites:
                target_slug = slug_by_name.get(prereq_name.lower())
                target_name = names_by_slug.get(target_slug, prereq_name)
                edges.append(KnowledgeEdge(source=concept.name, relation="requires", target=target_name))
        return edges
