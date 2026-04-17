from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

from datasets import Dataset
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from pydantic import SecretStr
from ragas import evaluate


CURRENT_DIR = Path(__file__).resolve().parent
WORKSPACE_ROOT = CURRENT_DIR.parents[2]
if str(WORKSPACE_ROOT) not in sys.path:
	sys.path.append(str(WORKSPACE_ROOT))

from backend.evaluation.ragas.config import RagasEvalConfig
from backend.evaluation.ragas.dataset_schema import has_complete_ground_truth, load_eval_samples
from backend.evaluation.ragas.report import build_report, write_json_report, write_markdown_summary


def _load_metrics(enable_recall: bool) -> list[Any]:
	"""
	Load metrics with compatibility for common RAGAS versions.
	"""
	try:
		from ragas.metrics import answer_relevancy, context_precision, context_recall, faithfulness

		metrics: list[Any] = [context_precision, faithfulness, answer_relevancy]
		if enable_recall:
			metrics.append(context_recall)
		return metrics
	except Exception:
		pass

	from ragas.metrics import Faithfulness, ResponseRelevancy

	try:
		from ragas.metrics import LLMContextPrecisionWithoutReference

		context_precision_metric = LLMContextPrecisionWithoutReference()
	except Exception as exc:
		raise RuntimeError("Unable to load a context relevancy metric from RAGAS.") from exc

	metrics = [context_precision_metric, Faithfulness(), ResponseRelevancy()]

	if enable_recall:
		try:
			from ragas.metrics import LLMContextRecall

			metrics.append(LLMContextRecall())
		except Exception:
			# Keep run alive even if recall metric is unavailable in installed version.
			pass

	return metrics


def _build_dataset_records(samples: list[Any]) -> list[dict[str, Any]]:
	return [sample.to_ragas_record() for sample in samples]


def parse_args() -> argparse.Namespace:
	parser = argparse.ArgumentParser(description="Run offline RAGAS evaluation for Inspira RAG.")
	parser.add_argument("--dataset", type=str, default=None, help="Path to eval dataset (.jsonl/.json).")
	parser.add_argument("--output", type=str, default=None, help="Output report JSON path.")
	parser.add_argument("--judge-model", type=str, default=None, help="Evaluator chat model.")
	parser.add_argument("--embedding-model", type=str, default=None, help="Evaluator embedding model.")
	return parser.parse_args()


def main() -> int:
	args = parse_args()
	config = RagasEvalConfig.from_env().with_overrides(
		dataset_path=Path(args.dataset) if args.dataset else None,
		output_path=Path(args.output) if args.output else None,
		judge_model=args.judge_model,
		embedding_model=args.embedding_model,
	)

	if not config.api_key:
		raise RuntimeError("OPENAI_API_KEY is required for RAGAS evaluation.")

	samples = load_eval_samples(config.dataset_path)
	recall_enabled = has_complete_ground_truth(samples)
	warning = None
	if not recall_enabled:
		warning = "ground_truth is missing in part of dataset; context recall metric was skipped."

	records = _build_dataset_records(samples)
	dataset = Dataset.from_list(records)

	api_key = SecretStr(config.api_key)
	llm = ChatOpenAI(api_key=api_key, model=config.judge_model, temperature=config.temperature)
	embeddings = OpenAIEmbeddings(api_key=api_key, model=config.embedding_model)

	metrics = _load_metrics(enable_recall=recall_enabled)
	result = evaluate(dataset=dataset, metrics=metrics, llm=llm, embeddings=embeddings)

	report_payload = build_report(
		result=result,
		config=config.to_dict(),
		sample_count=len(samples),
		recall_enabled=recall_enabled,
		warning=warning,
	)

	json_output = config.output_path
	md_output = config.output_path.with_suffix(".md")

	write_json_report(report_payload, json_output)
	write_markdown_summary(report_payload, md_output)

	print(f"RAGAS evaluation done. JSON report: {json_output}")
	print(f"Markdown summary: {md_output}")
	if warning:
		print(f"Warning: {warning}")
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
