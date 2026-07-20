from __future__ import annotations

import json
import os
import re
import time
import logging
from typing import Any, Callable, Optional
import requests

from .exceptions import LLMError

DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite"
DEFAULT_PDF_MODEL = "gemini-3.1-flash-lite"
DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant"

logger = logging.getLogger(__name__)

FakeResponder = Callable[[str, str], str]


class LLMClient:
    """
    Multi-provider LLM client for Structura.
    Strict PDF Model: gemini-3.1-flash-lite
    Strict Chatbot / AI Tutor Model: gemini-2.5-flash-lite
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
        self.gemini_model = model or os.environ.get("GEMINI_MODEL", DEFAULT_GEMINI_MODEL)

        self.groq_key = os.environ.get("GROQ_API_KEY") or os.environ.get("GROQ_KEY")
        self.groq_model = os.environ.get("GROQ_MODEL", DEFAULT_GROQ_MODEL)
        self.groq_url = os.environ.get("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions")

    def _call(self, system: str, user: str, force_json_hint: bool = False) -> str:
        if self._fake_responder is not None:
            return self._fake_responder(system, user)

        sys_prompt = system
        if force_json_hint:
            sys_prompt += "\n\nCRITICAL: Respond strictly with valid JSON only. Do not include markdown or prose commentary."

        errors = []

        # 1. Priority 1: Google Gemini API (if key starts with valid format or provided)
        if self.gemini_key and self.gemini_key.strip() and self.gemini_key.startswith("AIzaSy"):
            try:
                return self._call_gemini(sys_prompt, user)
            except Exception as gemini_err:
                logger.warning(f"Gemini call failed: {gemini_err}. Falling back to Groq...")
                errors.append(f"Gemini: {gemini_err}")

        # 2. Priority 2: Groq API Fallback
        if self.groq_key and self.groq_key.strip():
            try:
                return self._call_groq(sys_prompt, user)
            except Exception as groq_err:
                logger.warning(f"Groq call failed: {groq_err}")
                errors.append(f"Groq: {groq_err}")

        # 3. Priority 3: Gemini retry without prefix check
        if self.gemini_key and self.gemini_key.strip() and not self.gemini_key.startswith("AIzaSy"):
            try:
                return self._call_gemini(sys_prompt, user)
            except Exception as gemini_err:
                logger.warning(f"Gemini call failed: {gemini_err}")
                errors.append(f"Gemini: {gemini_err}")

        raise LLMError(f"All available LLM providers failed: {'; '.join(errors)}")

    def _call_gemini(self, system: str, user: str) -> str:
        model_name = self.gemini_model or "gemini-2.5-flash-lite"
        models_to_try = [
            model_name,
            "gemini-3.1-flash-lite",
            "gemini-2.5-flash-lite",
            "gemini-2.5-flash",
            "gemini-1.5-flash",
            "gemini-1.5-flash-8b",
        ]
        seen = set()
        models_to_try = [m for m in models_to_try if not (m in seen or seen.add(m))]

        last_error = None
        for m in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={self.gemini_key}"
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": f"{system}\n\n{user}"}],
                    }
                ],
                "generationConfig": {
                    "temperature": 0.3,
                    "maxOutputTokens": self.max_tokens,
                },
            }
            headers = {"Content-Type": "application/json"}

            try:
                resp = requests.post(url, headers=headers, json=payload, timeout=60)
                if resp.status_code == 429:
                    logger.warning(f"Gemini model {m} hit rate limit 429. Retrying next model...")
                    continue
                if resp.status_code != 200:
                    logger.warning(f"Gemini model {m} returned status {resp.status_code}: {resp.text[:150]}")
                    last_error = f"Gemini error {resp.status_code}: {resp.text[:200]}"
                    continue

                res_data = resp.json()
                candidates = res_data.get("candidates", [])
                if not candidates:
                    continue
                parts = candidates[0].get("content", {}).get("parts", [])
                if not parts:
                    continue
                return parts[0].get("text", "")
            except Exception as e:
                last_error = str(e)
                continue

        raise LLMError(f"All Gemini models failed. Last error: {last_error}")

    def _call_groq(self, system: str, user: str) -> str:
        headers = {
            "Authorization": f"Bearer {self.groq_key}",
            "Content-Type": "application/json",
        }
        
        # Ensure model is a valid Groq model string
        groq_models_to_try = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it", "mixtral-8x7b-32768"]
        if self.groq_model and "llama" in self.groq_model.lower():
            groq_models_to_try.insert(0, self.groq_model)

        last_error = None
        for g_model in groq_models_to_try:
            payload = {
                "model": g_model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "temperature": 0.3,
                "max_tokens": self.max_tokens,
            }

            try:
                resp = requests.post(self.groq_url, headers=headers, json=payload, timeout=60)
                if resp.status_code == 429:
                    logger.warning(f"Groq model {g_model} hit 429 rate limit. Retrying next Groq model...")
                    continue
                if resp.status_code != 200:
                    logger.warning(f"Groq model {g_model} returned status {resp.status_code}: {resp.text[:150]}")
                    last_error = f"Groq status {resp.status_code}: {resp.text[:200]}"
                    continue

                res_data = resp.json()
                choices = res_data.get("choices", [])
                if not choices:
                    continue
                return choices[0]["message"]["content"]
            except Exception as e:
                last_error = str(e)
                continue

        raise LLMError(f"All Groq models failed. Last error: {last_error}")

    def complete_json(self, system: str, user: str, retries: int = 2) -> Any:
        """Call LLM and parse a JSON-only response, self-correcting on parse failure."""
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
            raise LLMError(f"Failed to parse LLM JSON response: {e}\nRaw (truncated): {raw[:500]}") from e
