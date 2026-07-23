import fitz
import pytest

from app.services.document_extraction.exceptions import ExtractionError
from app.services.document_extraction.exporter import DocumentExtractionExporter
from app.services.document_extraction.service import DocumentExtractionService
from app.services.document_extraction.validator import DocumentExtractionValidator


def _make_sample_pdf(path: str) -> None:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), "Chapter 1: Introduction", fontsize=20, fontname="hebo")
    page.insert_text((72, 110), "This is the first paragraph of the book.", fontsize=11)
    page.insert_text((72, 130), "It spans a couple of lines of normal text.", fontsize=11)
    doc.save(path)
    doc.close()


@pytest.fixture()
def sample_pdf(tmp_path):
    pdf_path = tmp_path / "sample.pdf"
    _make_sample_pdf(str(pdf_path))
    return str(pdf_path)


def test_extract_returns_pages_and_blocks(sample_pdf):
    service = DocumentExtractionService()
    doc = service.extract(sample_pdf)

    assert doc.page_count == 1
    assert len(doc.pages) == 1
    page = doc.pages[0]
    assert len(page.blocks) >= 2
    all_text = " ".join(b.text for b in page.blocks)
    assert "Chapter 1" in all_text
    assert "first paragraph" in all_text


def test_heading_span_has_larger_font_size(sample_pdf):
    service = DocumentExtractionService()
    doc = service.extract(sample_pdf)
    sizes = [b.font_size for b in doc.pages[0].blocks]
    assert max(sizes) > min(sizes)


def test_missing_file_raises_extraction_error(tmp_path):
    service = DocumentExtractionService()
    with pytest.raises(ExtractionError):
        service.extract(str(tmp_path / "does_not_exist.pdf"))


def test_validator_rejects_empty_document(sample_pdf):
    service = DocumentExtractionService()
    doc = service.extract(sample_pdf)
    doc.pages = []
    doc.page_count = 0
    with pytest.raises(ExtractionError):
        DocumentExtractionValidator().validate(doc)


def test_exporter_writes_json_file(sample_pdf, tmp_path):
    service = DocumentExtractionService()
    doc = service.extract(sample_pdf)
    out_dir = tmp_path / "out"
    written_path = DocumentExtractionExporter().export(doc, str(out_dir))
    assert (out_dir / "document.extracted.json").exists()
    assert written_path.endswith("document.extracted.json")


def test_extract_txt_file(tmp_path):
    txt_path = tmp_path / "test.txt"
    txt_path.write_text("# Chapter 1\nThis is a text file content for learning structura.", encoding="utf-8")
    service = DocumentExtractionService()
    doc = service.extract(str(txt_path))
    assert doc.page_count >= 1
    all_text = " ".join(b.text for b in doc.pages[0].blocks)
    assert "Chapter 1" in all_text


def test_fallback_extraction_on_nonstandard_file(tmp_path):
    doc_path = tmp_path / "corrupted.doc"
    doc_path.write_text("Hello Structura Fallback Extraction Content line 1\nLine 2 content details", encoding="utf-8")
    service = DocumentExtractionService()
    doc = service.extract(str(doc_path))
    assert doc.page_count >= 1
    all_text = " ".join(b.text for b in doc.pages[0].blocks)
    assert "Structura Fallback" in all_text
