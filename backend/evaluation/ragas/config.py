from __future__ import annotations

import os
from dataclasses import asdict, dataclass
from pathlib import Path
from dotenv import load_dotenv


# Ensure backend/.env is loaded when running this module directly.
_backend_env = Path(__file__).resolve().parents[2] / ".env"
if _backend_env.exists():
	load_dotenv(dotenv_path=_backend_env, override=False)

_workspace_root = Path(__file__).resolve().parents[3]
_default_dataset = Path(__file__).resolve().parent / "eval_samples.jsonl"
_default_cleaned_dataset = Path(__file__).resolve().parent / "eval_samples.cleaned.jsonl"
_default_output = Path(__file__).resolve().parent / "eval_report.json"


def _resolve_path(raw_path: str | None, fallback: Path) -> Path:
	if not raw_path:
		return fallback
	p = Path(raw_path)
	if p.is_absolute():
		return p
	# Treat relative paths as workspace-root relative to avoid CWD surprises.
	return (_workspace_root / p).resolve()


@dataclass(frozen=True)
class RagasEvalConfig:
	"""Configuration for offline RAGAS evaluation."""

	api_key: str
	judge_model: str = "gpt-4o-mini"
	embedding_model: str = "text-embedding-3-small"
	temperature: float = 0.0
	dataset_path: Path = _default_dataset
	output_path: Path = _default_output

	@classmethod
	def from_env(cls) -> "RagasEvalConfig":
		api_key = os.getenv("OPENAI_API_KEY", "").strip()
		dataset_default = _default_cleaned_dataset if _default_cleaned_dataset.exists() else _default_dataset
		return cls(
			api_key=api_key,
			judge_model=os.getenv("RAGAS_JUDGE_MODEL", os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")),
			embedding_model=os.getenv("RAGAS_EMBEDDING_MODEL", "text-embedding-3-small"),
			temperature=float(os.getenv("RAGAS_TEMPERATURE", "0.0")),
			dataset_path=_resolve_path(os.getenv("RAGAS_DATASET_PATH"), dataset_default),
			output_path=_resolve_path(os.getenv("RAGAS_OUTPUT_PATH"), _default_output),
		)

	def with_overrides(
		self,
		dataset_path: Path | None = None,
		output_path: Path | None = None,
		judge_model: str | None = None,
		embedding_model: str | None = None,
	) -> "RagasEvalConfig":
		return RagasEvalConfig(
			api_key=self.api_key,
			judge_model=judge_model or self.judge_model,
			embedding_model=embedding_model or self.embedding_model,
			temperature=self.temperature,
			dataset_path=dataset_path or self.dataset_path,
			output_path=output_path or self.output_path,
		)

	def to_dict(self) -> dict:
		payload = asdict(self)
		payload["dataset_path"] = str(self.dataset_path)
		payload["output_path"] = str(self.output_path)
		payload["api_key"] = "***" if self.api_key else ""
		return payload
