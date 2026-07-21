"""
modules/review/user.py
========================
Purpose: USER prompt template for Module 9, extracted from
`EducationalReviewService._build_prompt`.
"""


def build_review_user_prompt(*, lesson_text: str, source_text: str, char_cap: int = 8000) -> str:
    return f"--- LESSON ---\n{lesson_text}\n\n--- SOURCE MATERIAL ---\n{source_text[:char_cap]}"
