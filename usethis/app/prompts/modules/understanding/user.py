"""
modules/understanding/user.py
===============================
Purpose: the USER prompt TEMPLATE for Module 3, extracted from
`DocumentUnderstandingService._build_prompt`. Keeping the template here
(rather than inline in service.py) means the prompt's wording can be
reviewed/diffed independently of the page-sampling logic, and a future
prompt-eval harness can call `build_understanding_user_prompt` directly
with fixture data without instantiating the whole service.

The service still owns *what data* goes in (page sampling, char limits) —
this file only owns the *template shape* around that data.
"""


def build_understanding_user_prompt(*, page_count: int, front_text: str, back_text: str,
                                      front_page_count: int, back_page_count: int) -> str:
    return (
        f"Total pages: {page_count}\n\n"
        f"--- FRONT MATTER (first {front_page_count} pages) ---\n{front_text}\n\n"
        f"--- BACK MATTER (last {back_page_count} pages) ---\n{back_text}"
    )
