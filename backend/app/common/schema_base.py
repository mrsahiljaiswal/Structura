from __future__ import annotations

import json
from dataclasses import asdict, is_dataclass
from pathlib import Path
from typing import Any, Type, TypeVar

T = TypeVar("T", bound="JSONArtifact")


def _default(o: Any):
    if is_dataclass(o):
        return asdict(o)
    raise TypeError(f"Object of type {type(o)} is not JSON serializable")


class JSONArtifact:
    """
    Mixin for dataclasses that represent a module's on-disk artifact
    (e.g. document.extracted.json, knowledge.json, lesson.json).

    Every module's schema.py output type should inherit this so the module
    can store its own output independently, per the pipeline philosophy.
    """

    def to_dict(self) -> dict:
        return asdict(self)  # type: ignore[arg-type]

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent, ensure_ascii=False, default=_default)

    def save(self, path: str | Path) -> Path:
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(self.to_json(), encoding="utf-8")
        return path

    @classmethod
    def load(cls: Type[T], path: str | Path) -> T:
        path = Path(path)
        data = json.loads(path.read_text(encoding="utf-8"))
        return cls.from_dict(data)  # type: ignore[attr-defined]

    @classmethod
    def from_dict(cls: Type[T], data: dict) -> T:
        """Default impl works for flat dataclasses; nested ones override this."""
        return cls(**data)  # type: ignore[call-arg]
