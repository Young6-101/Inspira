from __future__ import annotations

import argparse
import json
from pathlib import Path


CURRENT_DIR = Path(__file__).resolve().parent
WORKSPACE_ROOT = CURRENT_DIR.parents[3]
DEFAULT_INPUT = CURRENT_DIR / "eval_samples.jsonl"
DEFAULT_OUTPUT = CURRENT_DIR / "eval_samples.cleaned.jsonl"


def _resolve_path(raw: str, fallback: Path) -> Path:
    p = Path(raw) if raw else fallback
    if p.is_absolute():
        return p
    # If user passed "backend/..." keep it workspace-root relative.
    if str(p).replace("\\", "/").startswith("backend/"):
        return (WORKSPACE_ROOT / p).resolve()
    # Otherwise resolve relative to current script directory.
    return (CURRENT_DIR / p).resolve()


BAD_ANSWER_PATTERNS = [
    "you haven't uploaded any files yet",
    "retrieving and analyzing the papers",
    "please hold on for a moment",
    "let me analyze the contents",
    "could you please provide more details",
]


def _normalize_question(question: str) -> str:
    marker = "\n\n[System Note:"
    if marker in question:
        question = question.split(marker, 1)[0]
    return " ".join(question.split()).strip()


def _is_bad_answer(answer: str) -> bool:
    lowered = answer.lower()
    return any(p in lowered for p in BAD_ANSWER_PATTERNS)


def _clean_contexts(contexts: list[str]) -> list[str]:
    cleaned: list[str] = []
    seen: set[str] = set()

    for c in contexts:
        text = " ".join(str(c).split()).strip()
        if not text:
            continue
        if "[error describing image]" in text.lower():
            continue
        if text in seen:
            continue
        seen.add(text)
        cleaned.append(text)

    return cleaned


def _try_parse_jsonl_row(line: str) -> dict | None:
    try:
        obj = json.loads(line)
        return obj if isinstance(obj, dict) else None
    except json.JSONDecodeError:
        repaired = line
        if not repaired.startswith("{"):
            repaired = "{" + repaired
        if not repaired.endswith("}"):
            repaired = repaired + "}"
        try:
            obj = json.loads(repaired)
            return obj if isinstance(obj, dict) else None
        except json.JSONDecodeError:
            return None


def clean_dataset(input_path: Path, output_path: Path, max_contexts: int = 8) -> tuple[int, int]:
    kept = 0
    skipped = 0
    malformed = 0
    dedupe_keys: set[tuple[str, str]] = set()

    output_path.parent.mkdir(parents=True, exist_ok=True)

    with input_path.open("r", encoding="utf-8") as src, output_path.open("w", encoding="utf-8") as dst:
        for line in src:
            line = line.strip()
            if not line:
                continue
            row = _try_parse_jsonl_row(line)
            if row is None:
                malformed += 1
                skipped += 1
                continue

            question = _normalize_question(str(row.get("question", "")))
            answer = " ".join(str(row.get("answer", "")).split()).strip()
            raw_contexts_value = row.get("contexts")
            normalized_contexts: list[str] = []
            if isinstance(raw_contexts_value, list):
                normalized_contexts = [str(c) for c in raw_contexts_value]
            contexts = _clean_contexts(normalized_contexts)[:max_contexts]

            if not question or not answer:
                skipped += 1
                continue
            if not contexts:
                skipped += 1
                continue
            if _is_bad_answer(answer):
                skipped += 1
                continue

            dedupe_key = (question.lower(), answer.lower())
            if dedupe_key in dedupe_keys:
                skipped += 1
                continue
            dedupe_keys.add(dedupe_key)

            row["question"] = question
            row["answer"] = answer
            row["contexts"] = contexts

            dst.write(json.dumps(row, ensure_ascii=False) + "\n")
            kept += 1

    if malformed:
        print(f"[RAGAS][WARN] Skipped {malformed} malformed JSONL lines.")
    return kept, skipped


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Clean RAGAS jsonl dataset.")
    parser.add_argument(
        "--input",
        type=str,
        default=str(DEFAULT_INPUT),
        help="Input jsonl path",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=str(DEFAULT_OUTPUT),
        help="Output jsonl path",
    )
    parser.add_argument("--max-contexts", type=int, default=8, help="Max contexts per sample")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_path = _resolve_path(args.input, DEFAULT_INPUT)
    output_path = _resolve_path(args.output, DEFAULT_OUTPUT)

    if not input_path.exists():
        raise FileNotFoundError(f"Input dataset not found: {input_path}")

    kept, skipped = clean_dataset(input_path=input_path, output_path=output_path, max_contexts=args.max_contexts)
    print(f"Cleaned dataset written to: {output_path}")
    print(f"Kept: {kept}, Skipped: {skipped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
