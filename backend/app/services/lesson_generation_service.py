import os
import json
from typing import Dict, Any, List

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = os.getenv("GROQ_API_URL", "https://api.groq.dev/v1")
GROQ_MODEL = os.getenv("GROQ_MODEL", "groq-alpha")


class LessonGenerationService:
    def __init__(self):
        pass

    def generate_lesson(self, lesson_title: str, chapter_title: str, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate lesson content for a single lesson using provided relevant chunks.
        Returns a dict with: title, content, examples, key_takeaways, summary
        Falls back to deterministic heuristics if API not available.
        """
        text = "\n\n".join((c.get("text") if isinstance(c, dict) else getattr(c, 'text', '') for c in (chunks or [])))
        if GROQ_API_KEY and text.strip():
            try:
                import requests
                prompt = {
                    "task": "generate_lesson",
                    "schema": {
                        "title": "string",
                        "content": "string",
                        "examples": ["string"],
                        "key_takeaways": ["string"],
                        "summary": "string"
                    },
                    "lesson_title": lesson_title,
                    "chapter_title": chapter_title,
                    "context_snippets": [text[:1000]]
                }
                resp = requests.post(
                    f"{GROQ_API_URL}/models/{GROQ_MODEL}/generate",
                    headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                    json={"prompt": json.dumps(prompt), "max_tokens": 1200},
                    timeout=30,
                )
                resp.raise_for_status()
                out = resp.json()
                t = out.get("text") or out.get("output") or json.dumps(out)
                start = t.find("{")
                end = t.rfind("}")
                if start != -1 and end != -1:
                    parsed = json.loads(t[start:end+1])
                    return parsed
            except Exception:
                pass

        # Fallback simple generation
        content = (text or "").strip()
        summary = content[:400] + ("..." if len(content) > 400 else "")
        # naive key takeaways: split into sentences and pick first 3 lines
        lines = [l.strip() for l in content.split('\n') if l.strip()]
        key_takeaways = [l for l in lines[:3]]
        examples = []
        return {
            "title": lesson_title,
            "content": content[:4000],
            "examples": examples,
            "key_takeaways": key_takeaways,
            "summary": summary,
        }


def get_lesson_generation_service() -> LessonGenerationService:
    return LessonGenerationService()
