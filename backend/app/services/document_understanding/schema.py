from __future__ import annotations

from dataclasses import dataclass, field

from app.common.schema_base import JSONArtifact


@dataclass
class DocumentProfile(JSONArtifact):
    document_type: str  # book | research_paper | resume | lecture_notes | documentation | novel | specification | slides
    language: str
    title: str | None
    author: str | None
    publisher: str | None
    edition: str | None
    isbn: str | None
    has_preface: bool
    has_acknowledgements: bool
    has_copyright_page: bool
    has_table_of_contents: bool
    has_index: bool
    has_bibliography: bool
    has_appendix: bool
    has_references: bool
    confidence: float
    front_matter_pages: list[int] = field(default_factory=list)
    back_matter_pages: list[int] = field(default_factory=list)
