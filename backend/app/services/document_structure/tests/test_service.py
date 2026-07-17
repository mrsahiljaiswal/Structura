import pytest

from app.services.document_normalization.schema import (
    NormalizedBlock,
    NormalizedDocument,
    NormalizedPage,
)
from app.services.document_structure.exceptions import StructureError
from app.services.document_structure.service import DocumentStructureService
from app.services.document_structure.validator import DocumentStructureValidator


def _make_doc():
    pages = [
        NormalizedPage(page_number=1, blocks=[
            NormalizedBlock(text="Chapter 1: Storage", block_type="heading", page=1, font_size=20),
            NormalizedBlock(text="Transactions", block_type="heading", page=1, font_size=16),
            NormalizedBlock(text="Definition: a transaction is a unit of work.",
                             block_type="paragraph", page=1, font_size=11),
            NormalizedBlock(text="Example: BEGIN; UPDATE ...; COMMIT;",
                             block_type="paragraph", page=1, font_size=11),
        ]),
        NormalizedPage(page_number=2, blocks=[
            NormalizedBlock(text="Regular paragraph text here.", block_type="paragraph", page=2, font_size=11),
        ]),
    ]
    return NormalizedDocument(source_path="db.pdf", page_count=2, pages=pages)


def test_build_creates_chapter_and_section_nesting():
    structure = DocumentStructureService().build(_make_doc(), title="Database Internals")
    root = structure.tree
    assert root.level == "book"
    assert len(root.children) == 1
    chapter = root.children[0]
    assert chapter.level == "chapter"
    assert chapter.title == "Chapter 1: Storage"
    section = chapter.children[0]
    assert section.level == "section"
    assert section.title == "Transactions"


def test_build_classifies_definition_and_example():
    structure = DocumentStructureService().build(_make_doc())
    section = structure.tree.children[0].children[0]
    types = [c.node_type for c in section.children if c.level == "paragraph"]
    assert "definition" in types
    assert "example" in types


def test_build_spans_pages_correctly():
    structure = DocumentStructureService().build(_make_doc())
    chapter = structure.tree.children[0]
    assert chapter.page_start == 1
    assert chapter.page_end == 2  # paragraph on page 2 has no heading, stays under this chapter


def test_build_empty_document_raises():
    empty = NormalizedDocument(source_path="x.pdf", page_count=0, pages=[])
    with pytest.raises(StructureError):
        DocumentStructureService().build(empty)


def test_validator_rejects_empty_tree():
    structure = DocumentStructureService().build(_make_doc())
    structure.tree.children = []
    with pytest.raises(StructureError):
        DocumentStructureValidator().validate(structure)
