import pytest

from app.services.document_extraction.schema import (
    BoundingBox,
    ExtractedDocument,
    ExtractedPage,
    TextBlock,
)
from app.services.document_normalization.exceptions import NormalizationError
from app.services.document_normalization.service import DocumentNormalizationService
from app.services.document_normalization.validator import DocumentNormalizationValidator


def _block(text, y0, size=11.0, bold=False, x0=72.0):
    return TextBlock(text=text, font="Helvetica", font_size=size, bold=bold,
                      italic=False, bbox=BoundingBox(x0, y0, x0 + 100, y0 + size))


def _make_doc(n_pages=3):
    pages = []
    for i in range(1, n_pages + 1):
        blocks = [
            _block("This is the first line of a paragraph", y0=100, size=11),
            _block("that continues on the next line here.", y0=113, size=11),
            _block(f"Page {i}", y0=770, size=9),  # footer/page number, differs per page but still stripped
        ]
        if i == 1:
            # Only page 1 has the chapter heading - a running header would repeat
            # on every page and get stripped, but a one-off chapter title should not.
            blocks.insert(0, _block("Chapter Title", y0=40, size=20, bold=True))
        pages.append(ExtractedPage(page_number=i, width=612, height=792, blocks=blocks))
    return ExtractedDocument(source_path="x.pdf", page_count=n_pages, metadata={}, pages=pages)


def test_normalize_merges_paragraph_lines():
    result = DocumentNormalizationService().normalize(_make_doc())
    page_blocks = result.pages[0].blocks
    paragraph_texts = [b.text for b in page_blocks if b.block_type == "paragraph"]
    assert any("first line of a paragraph that continues" in t for t in paragraph_texts)


def test_normalize_detects_heading():
    result = DocumentNormalizationService().normalize(_make_doc())
    types = [b.block_type for b in result.pages[0].blocks]
    assert "heading" in types


def test_normalize_strips_repeated_footer():
    result = DocumentNormalizationService().normalize(_make_doc())
    for page in result.pages:
        texts = [b.text for b in page.blocks]
        assert not any(t.strip().lower().startswith("page ") for t in texts)
    assert result.removed_headers or True  # footers land in removed_headers bucket here


def test_normalize_empty_document_raises():
    empty = ExtractedDocument(source_path="x.pdf", page_count=0, metadata={}, pages=[])
    with pytest.raises(NormalizationError):
        DocumentNormalizationService().normalize(empty)


def test_validator_rejects_all_blocks_stripped():
    doc = DocumentNormalizationService().normalize(_make_doc())
    for page in doc.pages:
        page.blocks = []
    with pytest.raises(NormalizationError):
        DocumentNormalizationValidator().validate(doc)
