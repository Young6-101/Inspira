from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def _to_rows(result: Any) -> list[dict[str, Any]]:
	if hasattr(result, "to_pandas"):
		df = result.to_pandas()
		return df.to_dict(orient="records")
	if isinstance(result, list):
		return result
	return []


def _compute_metric_averages(rows: list[dict[str, Any]]) -> dict[str, float]:
	numeric: dict[str, list[float]] = {}
	for row in rows:
		for key, value in row.items():
			if isinstance(value, (int, float)):
				numeric.setdefault(key, []).append(float(value))

	return {
		key: round(sum(values) / len(values), 4)
		for key, values in numeric.items()
		if values
	}


def build_report(
	result: Any,
	config: dict[str, Any],
	sample_count: int,
	recall_enabled: bool,
	warning: str | None = None,
) -> dict[str, Any]:
	rows = _to_rows(result)
	metric_averages = _compute_metric_averages(rows)
	return {
		"generated_at": datetime.now(timezone.utc).isoformat(),
		"sample_count": sample_count,
		"recall_enabled": recall_enabled,
		"warning": warning,
		"config": config,
		"metrics": metric_averages,
		"per_sample": rows,
	}


def write_json_report(report: dict[str, Any], path: Path) -> None:
	path.parent.mkdir(parents=True, exist_ok=True)
	with path.open("w", encoding="utf-8") as fp:
		json.dump(report, fp, ensure_ascii=False, indent=2)


def write_markdown_summary(report: dict[str, Any], path: Path) -> None:
	path.parent.mkdir(parents=True, exist_ok=True)
	metrics = report.get("metrics", {})
	lines = [
		"# RAGAS Evaluation Summary",
		"",
		f"- Generated at: {report.get('generated_at', '')}",
		f"- Sample count: {report.get('sample_count', 0)}",
		f"- Context recall enabled: {report.get('recall_enabled', False)}",
	]
	warning = report.get("warning")
	if warning:
		lines.append(f"- Warning: {warning}")

	lines.extend(["", "## Metric Averages", ""])
	if metrics:
		for metric, value in metrics.items():
			lines.append(f"- {metric}: {value}")
	else:
		lines.append("- No numeric metrics returned.")

	with path.open("w", encoding="utf-8") as fp:
		fp.write("\n".join(lines) + "\n")
