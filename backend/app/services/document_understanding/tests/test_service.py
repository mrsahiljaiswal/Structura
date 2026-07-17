import json

import pytest

from app.common.llm_client import LLMClient
from app.services.document_normalization.schema import (
    NormalizedBlock,
    NormalizedDocument,
    NormalizedPage,
)
from app.services.document_understanding.exceptions import UnderstandingError
from app.services.document_understanding.service import DocumentUnderstandingService
from app.services.document_understanding.validator import DocumentUnderstandingValidator

GOOD_RESPONSE = {
    "document_type": "book",
    "language": "en",
    "title": "Database Internals",
    "author": "Jane Doe",
    "publisher": "O'Reilly",
    "edition": "1st",
    "isbn": "978-1-000000-01-1",
    "has_preface": True,
    "has_acknowledgements": True,
    "has_copyright_page": True,
    "has_table_of_contents": True,
    "has_index": True,
    "has_bibliography": True,
    "has_appendix": False,
    "has_references": True,
    "confidence": 0.92,
}


def _make_doc():
    pages = [
        NormalizedPage(page_number=1, blocks=[NormalizedBlock(
            text="Database Internals", block_type="heading", page=1, font_size=20)]),
        NormalizedPage(page_number=2, blocks=[NormalizedBlock(
            text="Table of Contents", block_type="heading", page=2, font_size=16)]),
    ]
    return NormalizedDocument(source_path="db.pdf", page_count=2, pages=pages)


def test_understand_parses_valid_response():
    client = LLMClient(fake_responder=lambda s, u: json.dumps(GOOD_RESPONSE))
    profile = DocumentUnderstandingService(llm_client=client).understand(_make_doc())
    assert profile.document_type == "book"
    assert profile.title == "Database Internals"
    assert profile.confidence == pytest.approx(0.92)


def test_understand_rejects_invalid_document_type():
    bad = dict(GOOD_RESPONSE, document_type="tv_show")
    client = LLMClient(fake_responder=lambda s, u: json.dumps(bad))
    with pytest.raises(UnderstandingError):
        DocumentUnderstandingService(llm_client=client).understand(_make_doc())


def test_understand_clamps_out_of_range_confidence():
    bad = dict(GOOD_RESPONSE, confidence=1.7)
    client = LLMClient(fake_responder=lambda s, u: json.dumps(bad))
    profile = DocumentUnderstandingService(llm_client=client).understand(_make_doc())
    assert profile.confidence == 1.0


def test_validator_rejects_low_confidence():
    profile = DocumentUnderstandingService(
        llm_client=LLMClient(fake_responder=lambda s, u: json.dumps(dict(GOOD_RESPONSE, confidence=0.1)))
    ).understand(_make_doc())
    with pytest.raises(UnderstandingError):
        DocumentUnderstandingValidator().validate(profile)


def test_understand_empty_document_raises():
    empty = NormalizedDocument(source_path="x.pdf", page_count=0, pages=[])
    client = LLMClient(fake_responder=lambda s, u: json.dumps(GOOD_RESPONSE))
    with pytest.raises(UnderstandingError):
        DocumentUnderstandingService(llm_client=client).understand(empty)
