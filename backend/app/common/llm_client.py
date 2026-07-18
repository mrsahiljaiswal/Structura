from __future__ import annotations

import json
import os
import re
import time
import logging
from typing import Any, Callable, Optional
import requests

from .exceptions import LLMError

DEFAULT_GEMINI_MODEL = "gemini-1.5-flash"

logger = logging.getLogger(__name__)

FakeResponder = Callable[[str, str], str]


class LLMClient:
    """
    Dedicated Google Gemini LLM client for Structura.
    Uses Google Gemini's native generateContent REST endpoint with automatic 429 backoff
    retries and JSON parsing validation.
    """

    def __init__(
        self,
        model: Optional[str] = None,
        max_tokens: int = 4096,
        fake_responder: Optional[FakeResponder] = None,
    ):
        self.max_tokens = max_tokens
        self._fake_responder = fake_responder

        self.gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GEMINI_KEY")
        self.model = model or os.environ.get("GEMINI_MODEL", DEFAULT_GEMINI_MODEL)

        if self.gemini_key:
            self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.gemini_key}"
        else:
            self.api_url = ""
            if self._fake_responder is None:
                logger.warning("GEMINI_API_KEY not found in environment. Falling back to mock responder.")

    def _call(self, system: str, user: str, force_json_hint: bool = False) -> str:
        if self._fake_responder is not None:
            return self._fake_responder(system, user)

        if not self.gemini_key:
            raise LLMError("GEMINI_API_KEY is missing from environment. Please set GEMINI_API_KEY in backend/.env.")

        sys_prompt = system
        if force_json_hint:
            sys_prompt += "\n\nCRITICAL: Respond strictly with valid JSON only. Do not include markdown or prose commentary."

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"{sys_prompt}\n\n{user}"}],
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": self.max_tokens,
            },
        }
        headers = {"Content-Type": "application/json"}

        max_attempts = 10
        for attempt in range(max_attempts):
            try:
                resp = requests.post(self.api_url, headers=headers, json=payload, timeout=60)
                if resp.status_code == 429:
                    if attempt == max_attempts - 1:
                        raise LLMError(
                            f"GEMINI API rate limit (429) persisted after {max_attempts} attempts. "
                            f"Details: {resp.text}"
                        )

                    sleep_sec = 2.0 * (attempt + 1)
                    try:
                        match = re.search(r"try again in ([0-9\.]+)s", resp.text)
                        if match:
                            sleep_sec = float(match.group(1)) + 0.5
                        elif resp.headers.get("retry-after"):
                            sleep_sec = float(resp.headers.get("retry-after")) + 0.5
                    except Exception:
                        pass

                    logger.warning(
                        f"Rate limit (429) hit from GEMINI. "
                        f"Sleeping {sleep_sec:.2f}s before retry (attempt {attempt+1}/{max_attempts})..."
                    )
                    time.sleep(sleep_sec)
                    continue

                if resp.status_code != 200:
                    raise LLMError(f"GEMINI API error {resp.status_code}: {resp.text}")

                res_data = resp.json()
                candidates = res_data.get("candidates", [])
                if not candidates:
                    raise LLMError(f"GEMINI returned no text candidates: {resp.text}")
                parts = candidates[0].get("content", {}).get("parts", [])
                if not parts:
                    raise LLMError(f"GEMINI returned empty text parts: {resp.text}")
                return parts[0].get("text", "")

            except LLMError:
                raise
            except Exception as e:
                if attempt < max_attempts - 1:
                    time.sleep(2.0 * (attempt + 1))
                    continue
                raise LLMError(f"HTTP call to GEMINI failed: {e}") from e

        raise LLMError("GEMINI API call failed after max retry attempts.")

    def complete_json(self, system: str, user: str, retries: int = 2) -> Any:
        """Call Google Gemini and parse a JSON-only response, self-correcting on parse failure."""
        raw = self._call(system, user)
        return self._parse_json(raw, system, user, retries)

    def _clean_json_string(self, raw: Optional[str]) -> str:
        if not raw:
            return ""
        # Strip Markdown code blocks
        cleaned = re.sub(r"```(?:json)?", "", raw, flags=re.IGNORECASE)
        cleaned = re.sub(r"```", "", cleaned).strip()

        # Try to find JSON object {} or array [] bounds
        start_brace = cleaned.find("{")
        start_bracket = cleaned.find("[")

        start = -1
        if start_brace != -1 and start_bracket != -1:
            start = min(start_brace, start_bracket)
        elif start_brace != -1:
            start = start_brace
        elif start_bracket != -1:
            start = start_bracket

        if start != -1:
            end_brace = cleaned.rfind("}")
            end_bracket = cleaned.rfind("]")
            end = max(end_brace, end_bracket)
            if end > start:
                return cleaned[start : end + 1].strip()

        return cleaned

    def _parse_json(self, raw: Optional[str], system: str, user: str, retries: int) -> Any:
        if not raw:
            if retries > 0:
                hinted_user = (
                    user
                    + "\n\nCRITICAL: You MUST respond strictly with a valid, single JSON object. Do not include markdown headers, bullet points, codeblock wrappers, or commentary."
                )
                raw = self._call(system, hinted_user, force_json_hint=True)
                return self._parse_json(raw, system, user, retries - 1)
            raise LLMError("Gemini returned an empty response.")

        cleaned = self._clean_json_string(raw)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            if retries > 0:
                hinted_user = (
                    user
                    + "\n\nCRITICAL: You MUST respond strictly with a valid, single JSON object. Do not include markdown headers, bullet points, codeblock wrappers, or commentary."
                )
                raw = self._call(system, hinted_user, force_json_hint=True)
                return self._parse_json(raw, system, user, retries - 1)
            raise LLMError(f"Failed to parse Gemini JSON response: {e}\nRaw (truncated): {raw[:500]}") from e
