from __future__ import annotations

import re
import unicodedata

_QUOTE_MAP = {
    "\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"',
    "\u2013": "-", "\u2014": "-", "\u2026": "...",
}
_BULLET_CHARS = "•◦▪‣∙·●○"
_HYPHEN_BREAK_RE = re.compile(r"(\w)-\s*\n\s*(\w)")
_MULTI_SPACE_RE = re.compile(r"[ \t]+")
_MULTI_NEWLINE_RE = re.compile(r"\n{3,}")
_PAGE_NUMBER_RE = re.compile(r"^\s*(page\s+)?\d{1,4}\s*$", re.IGNORECASE)


def normalize_unicode(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    for bad, good in _QUOTE_MAP.items():
        text = text.replace(bad, good)
    return text


def normalize_bullets(text: str) -> str:
    for ch in _BULLET_CHARS:
        text = text.replace(ch, "-")
    return text


def dehyphenate(text: str) -> str:
    """Rejoin words that were broken across a line by a trailing hyphen."""
    return _HYPHEN_BREAK_RE.sub(r"\1\2", text)


def collapse_whitespace(text: str) -> str:
    text = _MULTI_SPACE_RE.sub(" ", text)
    text = _MULTI_NEWLINE_RE.sub("\n\n", text)
    return text.strip()


def is_page_number(line: str) -> bool:
    return bool(_PAGE_NUMBER_RE.match(line.strip()))


def dedupe_lines(lines: list[str]) -> list[str]:
    seen = set()
    out = []
    for line in lines:
        key = line.strip().lower()
        if key and key in seen:
            continue
        seen.add(key)
        out.append(line)
    return out


def clean_text(text: str) -> str:
    """Full normalization pipeline for a single block of text."""
    text = normalize_unicode(text)
    text = normalize_bullets(text)
    text = dehyphenate(text)
    text = collapse_whitespace(text)
    return text
