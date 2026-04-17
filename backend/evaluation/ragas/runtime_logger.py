from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4


def _default_output_path() -> Path:
    return Path(__file__).resolve().parent / "eval_samples.jsonl"


def _as_context_list(raw: Any) -> list[str]:
    if isinstance(raw, list):
        return [str(item).strip() for item in raw if str(item).strip()]
    if isinstance(raw, str) and raw.strip():
        return [raw.strip()]
    return []


def append_chat_sample(
    *,
    question: str,
    answer: str,
    contexts: Any,
    stack_id: str,
    user_id: str,
    session_id: str,
    mode: str,
    model: str,
) -> None:
    """
    Append one /chat run to local RAGAS dataset file.
    This is best-effort and must not break online API flow.
    """
    enabled = os.getenv("RAGAS_LOG_CHAT_SAMPLES", "1").strip().lower() in {"1", "true", "yes", "on"}
    if not enabled:
        return

    output_path = Path(os.getenv("RAGAS_DATASET_PATH", str(_default_output_path())))
    record = {
        "sample_id": f"chat-{uuid4()}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "question": (question or "").strip(),
        "contexts": _as_context_list(contexts),
        "answer": (answer or "").strip(),
        "ground_truth": "",
        "metadata": {
            "source": "chat_endpoint",
            "stack_id": stack_id,
            "user_id": user_id,
            "session_id": session_id,
            "mode": mode,
            "model": model,
        },
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("a", encoding="utf-8") as fp:
        fp.write(json.dumps(record, ensure_ascii=False) + "\n")
