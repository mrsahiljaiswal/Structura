"""
tests/test_prompts.py
======================
Unit tests for the modular prompt framework.
Verifies that every registered prompt builder executes without raising
and includes required output rules and schemas.
"""

from app.prompts.registry import PROMPT_REGISTRY, get_prompt_version


def test_all_prompts_build():
    for name, entry in PROMPT_REGISTRY.items():
        prompt = entry.builder()
        assert isinstance(prompt, str)
        assert len(prompt) > 100, f"Prompt for '{name}' is unexpectedly short."
        assert "OUTPUT_RULES" in prompt or "JSON" in prompt, f"Prompt for '{name}' missing output rules."


def test_prompt_versions():
    for name in PROMPT_REGISTRY:
        version = get_prompt_version(name)
        assert isinstance(version, str)
        assert version.startswith("v")
