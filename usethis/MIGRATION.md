# Migrating existing services onto the prompt framework

Two worked examples below — Educational Review (smallest diff) and Lesson
Authoring (largest diff, since it currently has the biggest inline prompt).
The same pattern applies to Understanding, Knowledge Extraction, and the
Planner.

---

## 1. `app/services/educational_review/service.py`

### Before
```python
from app.common.course_style import COURSE_STYLE_GUIDE
...
SYSTEM_PROMPT = COURSE_STYLE_GUIDE + """
You are the Educational Review Engine in a document-intelligence pipeline. ...
[~50 lines of inline prompt text]
...
A lesson should be approved only if quality_score >= 70 AND there are no "high" severity issues."""


class EducationalReviewService:
    def __init__(self, llm_client: LLMClient | None = None):
        self.llm = llm_client or LLMClient()

    def review(self, lesson, units):
        ...
        data = self.llm.complete_json(SYSTEM_PROMPT, prompt)
        ...
```

### After
```python
from app.prompts.modules.review.system import build_review_system_prompt
from app.prompts.modules.review.user import build_review_user_prompt
from app.prompts.registry import get_prompt_version

logger = logging.getLogger(__name__)


class EducationalReviewService:
    def __init__(self, llm_client: LLMClient | None = None):
        self.llm = llm_client or LLMClient()
        self._system_prompt = build_review_system_prompt()

    def review(self, lesson, units):
        source_units = [u for u in units.units if u.id in lesson.learning_unit_ids]
        if not source_units:
            raise ReviewError(f"No source learning units found for lesson '{lesson.title}'.")

        source_text = "\n\n".join(
            f"Topic:\n{u.topic}\n\nSummary:\n{u.summary}\n\nContent:\n{u.text}"
            for u in source_units
        )
        lesson_text = (
            f"Overview: {lesson.overview}\n\nTheory: {lesson.theory}\n\n"
            f"Definitions: {lesson.definitions}\nExamples: {lesson.examples}\n"
            f"Analogies: {lesson.analogies}\nMisconceptions: {lesson.misconceptions}\n"
            f"Applications: {lesson.applications}\n\nSummary: {lesson.summary}\n"
            f"Key takeaways: {lesson.key_takeaways}"
        )
        prompt = build_review_user_prompt(lesson_text=lesson_text, source_text=source_text)

        logger.info("Reviewing lesson '%s' with prompt_version=%s",
                    lesson.lesson_id, get_prompt_version("review"))
        try:
            data = self.llm.complete_json(self._system_prompt, prompt)
        except LLMError as e:
            raise ReviewError(f"Failed to review lesson '{lesson.title}': {e}") from e

        return self._to_reviewed_lesson(lesson, data)
```

Notes:
- `SYSTEM_PROMPT` becomes a **built once, cached on the instance** value
  (`self._system_prompt`) rather than a module-level constant — this
  matters once prompts are composed from several imports rather than a
  single string literal, since composing on every `review()` call would
  be wasted work.
- `_build_prompt` staticmethod's template logic moves to
  `modules/review/user.py`; the *data gathering* (which units matter,
  what text to include) stays in the service, exactly as before.
- `logger.info(..., prompt_version=...)` is new and free — this is the
  observability win from centralizing versions in `registry.py`.
- `_to_reviewed_lesson` is unchanged; the framework only touches prompt
  construction, never response parsing.

---

## 2. `app/services/lesson_authoring/service.py`

### Before
```python
from app.common.course_style import COURSE_STYLE_GUIDE

SYSTEM_PROMPT = COURSE_STYLE_GUIDE+"""
You are the Lesson Authoring Engine for an AI-powered educational platform.
...
[~90 lines of inline prompt + schema + output rules interleaved]
...
"""

class LessonAuthoringService:
    def __init__(self, llm_client: LLMClient | None = None):
        self.llm = llm_client or LLMClient()

    def author(self, planned_lesson, units, prerequisite_titles=None):
        source_units = [u for u in units.units if u.id in planned_lesson.learning_unit_ids]
        if not source_units:
            raise LessonAuthoringError(...)
        prompt = self._build_prompt(planned_lesson, source_units, prerequisite_titles or [])
        data = self.llm.complete_json(SYSTEM_PROMPT, prompt)
        return self._to_lesson(planned_lesson, data)

    @staticmethod
    def _build_prompt(planned_lesson, source_units, prereq_titles):
        units_text = "\n\n".join(f"""... f-string ...""" for u in source_units)
        objectives = "\n".join(f"- {obj}" for obj in planned_lesson.learning_objectives)
        prereqs = ", ".join(prereq_titles) if prereq_titles else "None"
        return f"""... f-string with Lesson Title / Objectives / Difficulty / Source Material ..."""
```

### After
```python
from app.prompts.modules.authoring.system import build_authoring_system_prompt
from app.prompts.modules.authoring.user import build_authoring_user_prompt
from app.prompts.registry import get_prompt_version


class LessonAuthoringService:
    def __init__(self, llm_client: LLMClient | None = None):
        self.llm = llm_client or LLMClient()
        self._system_prompt = build_authoring_system_prompt()

    def author(self, planned_lesson, units, prerequisite_titles=None):
        source_units = [u for u in units.units if u.id in planned_lesson.learning_unit_ids]
        if not source_units:
            raise LessonAuthoringError(
                f"Lesson '{planned_lesson.title}' references no matching learning units."
            )

        units_text = "\n\n".join(
            f"### Learning Unit\n\nTopic:\n{u.topic}\n\nSummary:\n{u.summary}\n\n"
            f"Keywords:\n{', '.join(u.keywords)}\n\nContent:\n{u.text}"
            for u in source_units
        )
        prompt = build_authoring_user_prompt(
            lesson_title=planned_lesson.title,
            learning_objectives=planned_lesson.learning_objectives,
            difficulty=planned_lesson.difficulty,
            prerequisite_titles=prerequisite_titles or [],
            units_text=units_text,
        )

        try:
            data = self.llm.complete_json(self._system_prompt, prompt)
        except LLMError as e:
            raise LessonAuthoringError(f"Failed to author lesson '{planned_lesson.title}': {e}") from e

        return self._to_lesson(planned_lesson, data)
```

`author_all()` and `_to_lesson()` are untouched — only prompt construction moves.

---

## 3. Deleting the old duplication

Once every service above is migrated:
```bash
# app/common/course_style.py can be deleted entirely once both
# lesson_authoring and educational_review import from
# app.prompts.shared.writing_style instead.
git rm app/services/educational_planner/prompt_builder.py
git rm app/services/educational_planner/prompts.py   # SYSTEM_PROMPT/SCHEMA_PROMPT/etc, folded into modules/planner/system.py
git rm app/common/course_style.py
```

Do this LAST, after both consumers of each old file are confirmed migrated
— not as part of the same change that adds the new framework, so a
regression is bisectable to "the import changed" rather than "the file
disappeared and something broke silently."

## 4. Testing implications

Every existing `tests/test_service.py` that injects a `fake_responder`
into `LLMClient` keeps working unchanged — the framework only changes
*how the system prompt string is built*, not the service's public
interface or the `LLMClient` contract. Add one new test file,
`tests/test_prompts.py`, asserting each `PROMPT_REGISTRY` entry's builder
runs without raising and contains its module's required schema keys —
this catches an accidental broken import path before it reaches a live
LLM call:

```python
from app.prompts.registry import PROMPT_REGISTRY

def test_all_prompts_build():
    for name, entry in PROMPT_REGISTRY.items():
        text = entry.builder()
        assert text, f"{name} produced an empty prompt"
        assert "## ROLE" in text and "## OUTPUT RULES" in text
```
