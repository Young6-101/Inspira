from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class EvalSample:
	"""Single evaluation sample for RAGAS."""

	question: str
	answer: str
	contexts: list[str]
	ground_truth: str | None = None
	sample_id: str | None = None
	metadata: dict[str, Any] | None = None

	def to_ragas_record(self) -> dict[str, Any]:
		"""
		Build a record compatible with both old/new RAGAS column names.
		"""
		reference = (self.ground_truth or "").strip()
		return {
			# RAGAS <= 0.1 style columns
			"question": self.question,
			"answer": self.answer,
			"contexts": self.contexts,
			"ground_truth": reference,
			# RAGAS >= 0.2 style columns
			"user_input": self.question,
			"response": self.answer,
			"retrieved_contexts": self.contexts,
			"reference": reference,
			# Tracking
			"sample_id": self.sample_id or "",
			"metadata": self.metadata or {},
		}


def _require_non_empty_str(raw: Any, field_name: str) -> str:
	if not isinstance(raw, str) or not raw.strip():
		raise ValueError(f"Field '{field_name}' must be a non-empty string.")
	return raw.strip()


def _parse_contexts(raw: Any) -> list[str]:
	if not isinstance(raw, list) or not raw:
		raise ValueError("Field 'contexts' must be a non-empty list of strings.")

	parsed = [str(item).strip() for item in raw if str(item).strip()]
	if not parsed:
		raise ValueError("Field 'contexts' contains no valid text.")
	return parsed


def parse_sample(raw: dict[str, Any], index: int) -> EvalSample:
	try:
		question = _require_non_empty_str(raw.get("question"), "question")
		answer = _require_non_empty_str(raw.get("answer"), "answer")
		contexts = _parse_contexts(raw.get("contexts"))
		ground_truth_raw = raw.get("ground_truth")
		ground_truth = str(ground_truth_raw).strip() if ground_truth_raw else None
		sample_id = str(raw.get("sample_id") or raw.get("id") or f"sample-{index}")
		metadata = raw.get("metadata") if isinstance(raw.get("metadata"), dict) else None
	except ValueError as exc:
		raise ValueError(f"Invalid sample at index {index}: {exc}") from exc

	return EvalSample(
		question=question,
		answer=answer,
		contexts=contexts,
		ground_truth=ground_truth,
		sample_id=sample_id,
		metadata=metadata,
	)


def _try_parse_jsonl_row(line: str) -> dict[str, Any] | None:
	"""Parse a JSONL row with small auto-repair for common truncation issues."""
	try:
		row = json.loads(line)
		return row if isinstance(row, dict) else None
	except json.JSONDecodeError:
		# Common corruption: missing opening/closing brace for an object row.
		repaired = line
		if not repaired.startswith("{"):
			repaired = "{" + repaired
		if not repaired.endswith("}"):
			repaired = repaired + "}"
		try:
			row = json.loads(repaired)
			return row if isinstance(row, dict) else None
		except json.JSONDecodeError:
			return None


def load_eval_samples(path: Path) -> list[EvalSample]:
	if not path.exists():
		raise FileNotFoundError(f"Dataset file not found: {path}")

	suffix = path.suffix.lower()

	if suffix == ".jsonl":
		rows: list[dict[str, Any]] = []
		malformed_count = 0
		with path.open("r", encoding="utf-8") as fp:
			for line_no, line in enumerate(fp, start=1):
				line = line.strip()
				if not line:
					continue
				parsed = _try_parse_jsonl_row(line)
				if parsed is None:
					malformed_count += 1
					print(f"[RAGAS][WARN] Skipping malformed JSONL line {line_no}.")
					continue
				rows.append(parsed)
		if malformed_count:
			print(f"[RAGAS][WARN] Skipped {malformed_count} malformed JSONL lines.")
	elif suffix == ".json":
		with path.open("r", encoding="utf-8") as fp:
			payload = json.load(fp)
		if isinstance(payload, dict) and "samples" in payload:
			rows = payload["samples"]
		elif isinstance(payload, list):
			rows = payload
		else:
			raise ValueError("JSON dataset must be a list or an object containing key 'samples'.")
	else:
		raise ValueError("Only .jsonl or .json dataset formats are supported.")

	samples: list[EvalSample] = []
	invalid_count = 0
	for i, row in enumerate(rows):
		try:
			samples.append(parse_sample(raw=row, index=i))
		except ValueError as exc:
			invalid_count += 1
			print(f"[RAGAS][WARN] Skipping invalid sample {i}: {exc}")

	if invalid_count:
		print(f"[RAGAS][WARN] Skipped {invalid_count} invalid samples.")

	if not samples:
		raise ValueError(
			"No valid evaluation samples found. Ensure each sample has non-empty question/answer/contexts."
		)
	return samples


def has_complete_ground_truth(samples: list[EvalSample]) -> bool:
	return all((sample.ground_truth or "").strip() for sample in samples)
