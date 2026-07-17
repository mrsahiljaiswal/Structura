# DEPRECATED: This service is deprecated and will be removed in a future release.
# Use the consolidated app.services.educational_planner module instead.

import os
import json
from typing import Dict, Any, List

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = os.getenv("GROQ_API_URL", "https://api.groq.dev/v1")
GROQ_MODEL = os.getenv("GROQ_MODEL", "groq-alpha")


class CoursePlannerService:
    def __init__(self):
        pass

    def generate_outline(self, document) -> Dict[str, Any]:
        """
        Generate a course outline (metadata + chapters + lesson titles) from an ExtractedDocument.
        Falls back to a deterministic heuristic when Groq is not available.
        """
        chunks = getattr(document, "chunks", []) or []
        title = getattr(document, "document", None) and getattr(document.document, "filename", None) or "Generated Course"
        description = (document.clean_text.text[:400] if getattr(document, 'clean_text', None) and getattr(document.clean_text, 'text', None) else "Auto-generated course.")

        if GROQ_API_KEY and chunks:
            # Call Groq with a succinct prompt (we keep chunk snippets small to avoid huge prompts)
            try:
                import requests
                snippets = []
                for c in chunks:
                    text = c.get("text") if isinstance(c, dict) else getattr(c, 'text', '')
                    snippets.append(text[:400])
                prompt = {
                    "task": "generate_course_outline",
                    "schema": {
                        "title": "string",
                        "description": "string",
                        "difficulty": "string",
                        "chapters": [
                            {"id": "int", "title": "string", "lessons": ["string"]}
                        ]
                    },
                    "chunks": snippets
                }
                resp = requests.post(
                    f"{GROQ_API_URL}/models/{GROQ_MODEL}/generate",
                    headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                    json={"prompt": json.dumps(prompt), "max_tokens": 1200},
                    timeout=30,
                )
                resp.raise_for_status()
                out = resp.json()
                text = out.get("text") or out.get("output") or json.dumps(out)
                # attempt to extract json object
                start = text.find("{")
                end = text.rfind("}")
                if start != -1 and end != -1:
                    parsed = json.loads(text[start:end+1])
                    return parsed
            except Exception:
                # fall through to heuristic
                pass

        # Fallback heuristic: create 5 chapters (or based on chunks) and 3 lessons per chapter
        chunk_count = max(1, len(chunks))
        chapters_count = min(8, max(3, chunk_count // 5))
        chapters: List[Dict[str, Any]] = []
        for i in range(1, chapters_count + 1):
            chap_title = f"Chapter {i}"
            lessons = ["Introduction", "Key Concepts", "Examples"]
            chapters.append({"id": i, "title": chap_title, "lessons": lessons})

        outline = {
            "title": title,
            "description": description,
            "difficulty": "Intermediate",
            "chapters": chapters,
        }
        return outline


def get_course_planner_service() -> CoursePlannerService:
    return CoursePlannerService()
