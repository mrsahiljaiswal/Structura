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
DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant"
DEFAULT_OPENROUTER_MODEL = "meta-llama/llama-3.1-8b-instruct:free"

logger = logging.getLogger(__name__)

FakeResponder = Callable[[str, str], str]


class LLMClient:
    """
    Resilient multi-provider LLM client for Structura.
    Supports OpenRouter, Google Gemini, and Groq with automatic failovers.
    """

    def __init__(
        self,
        model: Optional[str] = None,
        max_tokens: int = 4096,
        fake_responder: Optional[FakeResponder] = None,
    ):
        self.max_tokens = max_tokens
        self._fake_responder = fake_responder

        self.openrouter_key = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("OPENROUTER_KEY")
        self.openrouter_model = model or os.environ.get("OPENROUTER_MODEL", DEFAULT_OPENROUTER_MODEL)

        self.gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GEMINI_KEY")
        self.gemini_model = os.environ.get("GEMINI_MODEL", DEFAULT_GEMINI_MODEL)

        self.groq_key = os.environ.get("GROQ_API_KEY")
        self.groq_model = os.environ.get("GROQ_MODEL", DEFAULT_GROQ_MODEL)

    def _call(self, system: str, user: str, force_json_hint: bool = False) -> str:
        if self._fake_responder is not None:
            return self._fake_responder(system, user)

        sys_prompt = system
        if force_json_hint:
            sys_prompt += "\n\nCRITICAL: Respond strictly with valid JSON only. Do not include markdown or prose commentary."

        # 1. Primary Priority: OpenRouter if OPENROUTER_API_KEY is present
        if self.openrouter_key:
            try:
                return self._call_openrouter(sys_prompt, user)
            except LLMError as err:
                logger.warning(f"OpenRouter call failed: {err}. Trying fallbacks...")

        # 2. Try Google Gemini (Requires AI Studio key starting with AIzaSy)
        if self.gemini_key and self.gemini_key.startswith("AIzaSy"):
            try:
                return self._call_gemini(sys_prompt, user)
            except LLMError as gemini_err:
                logger.warning(
                    f"Gemini call failed or hit quota limits: {gemini_err}. "
                    f"Attempting automatic fallback to Groq ({self.groq_model})..."
                )
                if self.groq_key:
                    return self._call_groq(sys_prompt, user)
                raise gemini_err

        # 3. Fallback: Groq
        if self.groq_key:
            return self._call_groq(sys_prompt, user)

        raise LLMError("No active LLM API keys found (neither OPENROUTER_API_KEY, GEMINI_API_KEY, nor GROQ_API_KEY).")

    def _call_openrouter(self, system: str, user: str) -> str:
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openrouter_key}",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Structura AI",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.openrouter_model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.2,
            "max_tokens": self.max_tokens,
        }

        max_attempts = 4
        for attempt in range(max_attempts):
            try:
                resp = requests.post(url, headers=headers, json=payload, timeout=60)
                if resp.status_code == 429:
                    if attempt == max_attempts - 1:
                        raise LLMError(f"OpenRouter 429 rate limit reached ({resp.text[:200]})")
                    sleep_sec = 2.0 * (attempt + 1)
                    time.sleep(sleep_sec)
                    continue

                if resp.status_code != 200:
                    raise LLMError(f"OpenRouter API error {resp.status_code}: {resp.text[:300]}")

                res_data = resp.json()
                choices = res_data.get("choices", [])
                if not choices:
                    raise LLMError(f"OpenRouter returned empty choices: {resp.text[:200]}")
                return choices[0]["message"]["content"]
            except LLMError:
                raise
            except Exception as e:
                if attempt == max_attempts - 1:
                    raise LLMError(f"OpenRouter call failed: {e}") from e
                time.sleep(2.0 * (attempt + 1))

        raise LLMError("OpenRouter call failed.")

    def _call_gemini(self, system: str, user: str) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={self.gemini_key}"
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"{system}\n\n{user}"}],
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": self.max_tokens,
            },
        }
        headers = {"Content-Type": "application/json"}

        max_attempts = 3  # Fast failover if Gemini hits quota limits
        for attempt in range(max_attempts):
            try:
                resp = requests.post(url, headers=headers, json=payload, timeout=45)
                if resp.status_code == 429:
                    if attempt == max_attempts - 1:
                        raise LLMError(f"GEMINI 429 quota reached ({resp.text[:200]})")

                    sleep_sec = 1.5 * (attempt + 1)
                    try:
                        match = re.search(r"try again in ([0-9\.]+)s", resp.text)
                        if match:
                            sleep_sec = float(match.group(1)) + 0.5
                    except Exception:
                        pass

                    logger.warning(f"Gemini 429 limit hit. Retrying in {sleep_sec:.1f}s...")
                    time.sleep(sleep_sec)
                    continue

                if resp.status_code != 200:
                    raise LLMError(f"Gemini API error {resp.status_code}: {resp.text[:300]}")

                res_data = resp.json()
                candidates = res_data.get("candidates", [])
                if not candidates:
                    raise LLMError("Gemini returned no text candidates.")
                parts = candidates[0].get("content", {}).get("parts", [])
                if not parts:
                    raise LLMError("Gemini returned empty text parts.")
                return parts[0].get("text", "")

            except LLMError:
                raise
            except Exception as e:
                if attempt == max_attempts - 1:
                    raise LLMError(f"Gemini request failed: {e}") from e
                time.sleep(1.5 * (attempt + 1))

        raise LLMError("Gemini call failed.")

    def _call_groq(self, system: str, user: str) -> str:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.groq_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.groq_model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.2,
            "max_tokens": self.max_tokens,
        }

        max_attempts = 4
        for attempt in range(max_attempts):
            try:
                resp = requests.post(url, headers=headers, json=payload, timeout=60)
                if resp.status_code == 429:
                    if attempt == max_attempts - 1:
                        raise LLMError(f"Groq 429 rate limit reached ({resp.text[:200]})")
                    sleep_sec = 1.5 * (attempt + 1)
                    time.sleep(sleep_sec)
                    continue

                if resp.status_code != 200:
                    raise LLMError(f"Groq API error {resp.status_code}: {resp.text[:300]}")

                res_data = resp.json()
                return res_data["choices"][0]["message"]["content"]
            except LLMError:
                raise
            except Exception as e:
                if attempt == max_attempts - 1:
                    raise LLMError(f"Groq call failed: {e}") from e
                time.sleep(1.5 * (attempt + 1))

        raise LLMError("Groq call failed.")

    def complete_json(self, system: str, user: str, retries: int = 2) -> Any:
        """Call LLM (Gemini or Groq fallback) and parse a JSON-only response."""
        raw = self._call(system, user)
        return self._parse_json(raw, system, user, retries)

    def _clean_json_string(self, raw: Optional[str]) -> str:
        if not raw:
            return ""
        cleaned = re.sub(r"```(?:json)?", "", raw, flags=re.IGNORECASE)
        cleaned = re.sub(r"```", "", cleaned).strip()

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
            raise LLMError("LLM returned an empty response.")

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
            raise LLMError(f"Failed to parse JSON response: {e}\nRaw (truncated): {raw[:500]}") from e
