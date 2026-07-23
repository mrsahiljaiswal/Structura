from __future__ import annotations
from dataclasses import dataclass, field
from app.common.schema_base import JSONArtifact
from app.services.document_normalization.schema import NormalizedDocument, NormalizedPage


@dataclass
class SourceFileSummary:
    document_id: str
    filename: str
    file_type: str
    page_count: int
    summary: str | None = None


@dataclass
class SynthesizedDocument(JSONArtifact):
    course_title: str
    source_files: list[SourceFileSummary] = field(default_factory=list)
    normalized_document: NormalizedDocument | None = None
