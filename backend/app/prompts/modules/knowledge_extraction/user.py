"""
modules/knowledge_extraction/user.py
======================================
Purpose: USER prompt template for Module 5, extracted from
`KnowledgeExtractionService._extract_for_unit`.
"""


def build_knowledge_extraction_user_prompt(*, unit_title: str, text: str, char_cap: int = 2500) -> str:
    return f"Section: {unit_title}\n\n{text[:char_cap]}"
