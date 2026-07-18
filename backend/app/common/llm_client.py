from __future__ import annotations

import json
import os
import re
import logging
from typing import Any, Callable, Optional
import requests

from .exceptions import LLMError

DEFAULT_GEMINI_MODEL = "gemini-1.5-flash"
DEFAULT_ANTHROPIC_MODEL = "claude-3-5-sonnet-20240620"
DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant"
DEFAULT_OPENAI_MODEL = "gpt-4o-mini"

logger = logging.getLogger(__name__)

FakeResponder = Callable[[str, str], str]


class LLMClient:
    """
    Generalized LLM client supporting multiple providers.
    Automatically resolves endpoints and authorization credentials from the environment.
    Supports Anthropic Messages API, Groq, and OpenAI chat completions.
    """

    def __init__(
        self,
        model: Optional[str] = None,
        max_tokens: int = 4096,
        fake_responder: Optional[FakeResponder] = None,
    ):
        self.max_tokens = max_tokens
        self._fake_responder = fake_responder
        self._client = None

        # Resolve provider and credentials
        self.gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GEMINI_KEY")
        self.anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
        self.groq_key = os.environ.get("GROQ_API_KEY")
        self.openai_key = os.environ.get("OPENAI_API_KEY")

        # Priority 1: Google Gemini API
        if self.gemini_key:
            self.provider = "gemini"
            self.model = model or os.environ.get("GEMINI_MODEL", DEFAULT_GEMINI_MODEL)
            self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.gemini_key}"
        elif self.anthropic_key:
            self.provider = "anthropic"
            self.model = model or os.environ.get("ANTHROPIC_MODEL", DEFAULT_ANTHROPIC_MODEL)
        elif self.groq_key:
            self.provider = "groq"
            self.model = model or os.environ.get("GROQ_MODEL", DEFAULT_GROQ_MODEL)
            self.api_url = os.environ.get("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions")
        elif self.openai_key:
            self.provider = "openai"
            self.model = model or os.environ.get("OPENAI_MODEL", DEFAULT_OPENAI_MODEL)
            self.api_url = os.environ.get("OPENAI_API_URL", "https://api.openai.com/v1/chat/completions")
        else:
            self.provider = "mock"
            self.model = "mock-model"
            if self._fake_responder is None:
                logger.warning("No LLM API keys found in the environment. Falling back to mock/fake responder.")

    def _get_anthropic_client(self):
        if self._client is None:
            try:
                import anthropic
            except ImportError as e:
                raise LLMError(
                    "The 'anthropic' package is required for live Anthropic calls. "
                    "Install it or configure GROQ_API_KEY/OPENAI_API_KEY instead."
                ) from e
            self._client = anthropic.Anthropic(api_key=self.anthropic_key)
        return self._client

    def _call(self, system: str, user: str, force_json_hint: bool = False) -> str:
        if self._fake_responder is not None:
            return self._fake_responder(system, user)

        sys_prompt = system
        if force_json_hint:
            sys_prompt += "\n\nIMPORTANT: Respond with ONLY valid JSON. No prose, no markdown fences."

        if self.provider == "anthropic":
            client = self._get_anthropic_client()
            response = client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                system=sys_prompt,
                messages=[{"role": "user", "content": user}],
            )
            return "".join(
                block.text for block in response.content if getattr(block, "type", None) == "text"
            )

        elif self.provider == "gemini":
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.gemini_key}"
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

            import time

            max_attempts = 10
            for attempt in range(max_attempts):
                try:
                    resp = requests.post(url, headers=headers, json=payload, timeout=60)
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
                        raise LLMError(f"GEMINI returned no candidates: {resp.text}")
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if not parts:
                        raise LLMError(f"GEMINI returned empty parts: {resp.text}")
                    return parts[0].get("text", "")
                except LLMError:
                    raise
                except Exception as e:
                    if attempt < max_attempts - 1:
                        time.sleep(2.0 * (attempt + 1))
                        continue
                    raise LLMError(f"HTTP call to GEMINI failed: {e}") from e

        elif self.provider in ("groq", "openai"):
            key = self.groq_key if self.provider == "groq" else self.openai_key
            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": user}
                ],
                "temperature": 0.2,
                "max_tokens": self.max_tokens
            }

            import time
            max_attempts = 10
            for attempt in range(max_attempts):
                try:
                    resp = requests.post(self.api_url, headers=headers, json=payload, timeout=60)
                    if resp.status_code == 429:
                        if attempt == max_attempts - 1:
                            raise LLMError(
                                f"{self.provider.upper()} API rate limit (429) persisted after {max_attempts} attempts. "
                                f"Details: {resp.text}"
                            )

                        # Extract exact retry seconds from error message or header
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
                            f"Rate limit (429) hit from {self.provider.upper()}. "
                            f"Sleeping {sleep_sec:.2f}s before retry (attempt {attempt+1}/{max_attempts})..."
                        )
                        time.sleep(sleep_sec)
                        continue

                    if resp.status_code != 200:
                        raise LLMError(f"{self.provider.upper()} API error {resp.status_code}: {resp.text}")

                    res_data = resp.json()
                    return res_data["choices"][0]["message"]["content"]
                except LLMError:
                    raise
                except Exception as e:
                    if attempt < max_attempts - 1:
                        sleep_sec = 2.0 * (attempt + 1)
                        time.sleep(sleep_sec)
                        continue
                    raise LLMError(f"HTTP call to {self.provider.upper()} failed: {e}") from e

        else:
            raise LLMError("No API keys set in the environment to execute LLM calls.")

    def complete_json(self, system: str, user: str, retries: int = 2) -> Any:
        """Call the model and parse a JSON-only response, self-correcting on parse failure."""
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
                raw = self._call(system, hinted_user)
                return self._parse_json(raw, system, user, retries - 1)
            raise LLMError("LLM returned an empty or None response.")

        cleaned = self._clean_json_string(raw)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            if retries > 0:
                hinted_user = (
                    user
                    + "\n\nCRITICAL: You MUST respond strictly with a valid, single JSON object. Do not include markdown headers, bullet points, codeblock wrappers, or commentary."
                )
                raw = self._call(system, hinted_user)
                return self._parse_json(raw, system, user, retries - 1)
            raise LLMError(f"Failed to parse LLM JSON response: {e}\nRaw (truncated): {raw[:500]}") from e
