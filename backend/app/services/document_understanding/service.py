from __future__ import annotations

from app.common.exceptions import LLMError
from app.common.llm_client import LLMClient
from app.services.document_normalization.schema import NormalizedDocument

from .exceptions import UnderstandingError
from .schema import DocumentProfile

from app.prompts.modules.understanding.system import build_understanding_system_prompt, ALLOWED_TYPES
from app.prompts.modules.understanding.user import build_understanding_user_prompt
from app.prompts.registry import get_prompt_version

FRONT_MATTER_CHAR_LIMIT = 1500
BACK_MATTER_CHAR_LIMIT = 800
FRONT_MATTER_PAGE_SAMPLE = 5
BACK_MATTER_PAGE_SAMPLE = 3


class DocumentUnderstandingService:
    """
    Module 3: Document Understanding Engine.

    First AI module in the pipeline. Answers "what kind of document is this?"
    using a text sample of front/back matter, not the full document (keeps
    cost bounded and the task focused).
    """

    def __init__(self, llm_client: LLMClient | None = None):
        self.llm = llm_client or LLMClient(model="gemini-3.1-flash-lite")
        self._system_prompt = build_understanding_system_prompt()

    def understand(self, normalized: NormalizedDocument) -> DocumentProfile:
        if not normalized.pages:
            raise UnderstandingError("Cannot classify a document with zero pages.")

        user_prompt = self._build_prompt(normalized)
        try:
            data = self.llm.complete_json(self._system_prompt, user_prompt)
        except LLMError as e:
            raise UnderstandingError(f"Document classification failed: {e}") from e

        return self._to_profile(data, normalized)

    def _build_prompt(self, normalized: NormalizedDocument) -> str:
        front_pages = normalized.pages[:FRONT_MATTER_PAGE_SAMPLE]
        back_pages = normalized.pages[-BACK_MATTER_PAGE_SAMPLE:]

        front_text = self._pages_to_text(front_pages)[:FRONT_MATTER_CHAR_LIMIT]
        back_text = self._pages_to_text(back_pages)[:BACK_MATTER_CHAR_LIMIT]

        return build_understanding_user_prompt(
            page_count=normalized.page_count,
            front_text=front_text,
            back_text=back_text,
            front_page_count=len(front_pages),
            back_page_count=len(back_pages),
        )

    @staticmethod
    def _pages_to_text(pages) -> str:
        parts = []
        for page in pages:
            for block in page.blocks:
                parts.append(block.text)
        return "\n".join(parts)

    def _to_profile(self, data: dict, normalized: NormalizedDocument) -> DocumentProfile:
        doc_type = data.get("document_type")
        if doc_type not in ALLOWED_TYPES:
            raise UnderstandingError(f"LLM returned an invalid document_type: {doc_type!r}")

        confidence = float(data.get("confidence", 0.0))
        confidence = max(0.0, min(1.0, confidence))

        return DocumentProfile(
            document_type=doc_type,
            language=data.get("language", "en"),
            title=data.get("title"),
            author=data.get("author"),
            publisher=data.get("publisher"),
            edition=data.get("edition"),
            isbn=data.get("isbn"),
            has_preface=bool(data.get("has_preface", False)),
            has_acknowledgements=bool(data.get("has_acknowledgements", False)),
            has_copyright_page=bool(data.get("has_copyright_page", False)),
            has_table_of_contents=bool(data.get("has_table_of_contents", False)),
            has_index=bool(data.get("has_index", False)),
            has_bibliography=bool(data.get("has_bibliography", False)),
            has_appendix=bool(data.get("has_appendix", False)),
            has_references=bool(data.get("has_references", False)),
            confidence=confidence,
            front_matter_pages=[p.page_number for p in normalized.pages[:FRONT_MATTER_PAGE_SAMPLE]],
            back_matter_pages=[p.page_number for p in normalized.pages[-BACK_MATTER_PAGE_SAMPLE:]],
        )
