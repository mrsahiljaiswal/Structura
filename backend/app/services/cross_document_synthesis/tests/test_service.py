import pytest
from app.services.document_normalization.schema import NormalizedDocument, NormalizedPage, NormalizedBlock
from app.services.cross_document_synthesis.service import CrossDocumentSynthesisService


def test_cross_document_synthesis_merges_documents():
    page1 = NormalizedPage(
        page_number=1,
        blocks=[
            NormalizedBlock(text="Operating Systems Chapter 1", font_size=16.0, bold=True, block_type="heading", page=1),
            NormalizedBlock(text="An operating system manages computer hardware.", font_size=12.0, bold=False, block_type="paragraph", page=1),
        ],
        tables=[],
    )
    doc1 = NormalizedDocument(source_path="/tmp/OS_Notes.docx", page_count=1, pages=[page1], removed_headers=[], removed_footers=[])

    page2 = NormalizedPage(
        page_number=1,
        blocks=[
            NormalizedBlock(text="Computer Networks Introduction", font_size=16.0, bold=True, block_type="heading", page=1),
            NormalizedBlock(text="A computer network connects multiple nodes.", font_size=12.0, bold=False, block_type="paragraph", page=1),
        ],
        tables=[],
    )
    doc2 = NormalizedDocument(source_path="/tmp/CN_Slides.pptx", page_count=1, pages=[page2], removed_headers=[], removed_footers=[])

    service = CrossDocumentSynthesisService()
    synthesized = service.synthesize([doc1, doc2], course_title="OS and Networks Master Course")

    assert synthesized.course_title == "OS and Networks Master Course"
    assert len(synthesized.source_files) == 2
    assert synthesized.source_files[0].filename == "OS_Notes.docx"
    assert synthesized.source_files[1].filename == "CN_Slides.pptx"

    combined_doc = synthesized.normalized_document
    assert combined_doc.page_count == 2
    all_text = " ".join(b.text for p in combined_doc.pages for b in p.blocks)
    assert "operating system" in all_text.lower()
    assert "computer network" in all_text.lower()
