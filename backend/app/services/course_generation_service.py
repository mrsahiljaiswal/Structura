"""
DEPRECATED: This service is deprecated and will be removed in a future release.
Use the consolidated app.pipeline.orchestrator module instead.

AI Course Generation service using the Groq API.

This service accepts an ExtractedDocument (with semantic chunks) and
produces a structured course JSON according to the requested schema.

It writes the resulting course JSON to `uploads/<file>.course.json` and
updates the document processing stage to COURSE_GENERATED.

Configuration (environment variables):
- GROQ_API_KEY: required API key for Groq
- GROQ_API_URL: optional API base URL (defaults to Groq generative endpoint)
- GROQ_MODEL: optional model id
"""
from __future__ import annotations

import os
import json
import time
from pathlib import Path
from typing import Any, Dict

import requests

from app.schemas.extracted_document import ExtractedDocument, DocumentStatus


class CourseGenerationError(Exception):
    pass


class CourseGenerationService:
    def __init__(self):
        self.api_key = os.environ.get("GROQ_API_KEY")
        self.api_url = os.environ.get(
            "GROQ_API_URL", "https://api.groq.com/v1/generate"
        )
        self.model = os.environ.get("GROQ_MODEL", "groq-alpha")

    def generate_course(self, document: ExtractedDocument) -> Dict[str, Any]:
        """Generate a structured course JSON for the provided document.

        The function will:
        - Build a prompt from the provided chunks
        - Call the Groq generative API
        - Parse the returned JSON and write it to `*.course.json`
        - Update document.processing and document.document.status

        Returns:
            The parsed course JSON as a Python dict.
        """
        if not document.chunks:
            raise CourseGenerationError("Document contains no chunks to generate a course")

        if not self.api_key:
            raise CourseGenerationError("GROQ_API_KEY not configured in environment")

        # Build instruction + payload
        prompt = self._build_prompt(document)

        payload = {
            "model": self.model,
            "input": prompt,
            "temperature": 0.2,
            "max_output_tokens": 2000,
        }

        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

        # Call Groq generative endpoint
        resp = requests.post(self.api_url, headers=headers, json=payload, timeout=60)

        if resp.status_code != 200:
            raise CourseGenerationError(f"Groq API error {resp.status_code}: {resp.text}")

        text = resp.text

        # Attempt to parse JSON out of the response body
        course_json = self._extract_json(text)

        # Update processing info and export
        document.processing.current_stage = DocumentStatus.COURSE_GENERATED
        document.processing.progress = 80
        document.processing.next_stage = DocumentStatus.READY
        document.document.status = DocumentStatus.COURSE_GENERATED

        # Write course json to uploads
        source_path = Path(document.document.file_path)
        course_path = source_path.with_suffix(".course.json")
        course_path.write_text(json.dumps(course_json, indent=2, ensure_ascii=False), encoding="utf-8")

        return course_json

    def _build_prompt(self, document: ExtractedDocument) -> str:
        """Construct a concise instruction prompt for the LLM.

        The prompt instructs the model to return ONLY JSON adhering to the course
        structure specified in the product requirements.
        """
        instructions = (
            "You are a helpful professor. Convert the provided document chunks into "
            "a structured learning course. Output MUST be valid JSON and follow this schema:\n"
            "{\n  \"title\": str,\n  \"description\": str,\n  \"difficulty\": str,\n  \"estimated_time_minutes\": int,\n  \"learning_objectives\": [str],\n  \"prerequisites\": [str],\n  \"chapters\": [\n    {\n      \"title\": str,\n      \"summary\": str,\n      \"estimated_duration_minutes\": int,\n      \"lessons\": [\n        {\n          \"title\": str,\n          \"explanation\": str,\n          \"examples\": [str],\n          \"key_takeaways\": [str],\n          \"summary\": str\n        }\n      ]\n    }\n  ]\n}\n"
        )

        # Add lightweight chunk listing (title + text snippet)
        chunks_text = []
        for c in document.chunks:
            snippet = c.text.strip().replace("\n", " ")[:800]
            chunks_text.append(f"CHUNK {c.chunk_index} (pages {c.page_start}-{c.page_end}): {snippet}")

        prompt = (
            instructions
            + "\nDocument filename: "
            + str(document.document.original_filename)
            + "\nProvide the course JSON only. Do not include any commentary.\nChunks:\n"
            + "\n\n".join(chunks_text)
        )

        return prompt

    def _extract_json(self, text: str) -> Dict[str, Any]:
        """Extract JSON object from model response text.

        Tries to load the body as JSON; if that fails, attempts to find the first
        JSON object substring and parse it.
        """
        # Try direct parse
        try:
            return json.loads(text)
        except Exception:
            pass

        # Fallback: find first '{' and last '}' and attempt to load
        first = text.find("{")
        last = text.rfind("}")
        if first == -1 or last == -1 or last <= first:
            raise CourseGenerationError("Failed to extract JSON from Groq response")

        candidate = text[first : last + 1]
        try:
            return json.loads(candidate)
        except Exception as exc:
            raise CourseGenerationError(f"Failed to parse JSON from Groq response: {exc}")


def get_course_generation_service() -> CourseGenerationService:
    return CourseGenerationService()
