"""
Lightweight stack-scoped vector store backed by JSON files.

This keeps the Lambda package small while still supporting semantic retrieval
through Gemini embeddings and cosine similarity.
"""
import json
import math
import os
import uuid
from pathlib import Path

from rag_engine.embedder import InspiraEmbedder


class InspiraVault:
    def __init__(self, db_path: str | None = None):
        self.db_path = Path(db_path or os.getenv("VECTOR_DB_PATH", "./inspira_db"))
        self.db_path.mkdir(parents=True, exist_ok=True)
        self.embedder = InspiraEmbedder()

    def _stack_file(self, stack_id: str) -> Path:
        return self.db_path / f"stack_{stack_id}.json"

    def _load_records(self, stack_id: str) -> list[dict]:
        stack_file = self._stack_file(stack_id)
        if not stack_file.exists():
            return []

        try:
            with stack_file.open("r", encoding="utf-8") as handle:
                data = json.load(handle)
            return data if isinstance(data, list) else []
        except Exception:
            return []

    def _save_records(self, stack_id: str, records: list[dict]) -> None:
        stack_file = self._stack_file(stack_id)
        tmp_file = stack_file.with_suffix(".json.tmp")
        with tmp_file.open("w", encoding="utf-8") as handle:
            json.dump(records, handle, ensure_ascii=False)
        tmp_file.replace(stack_file)

    @staticmethod
    def _cosine_similarity(left: list[float], right: list[float]) -> float:
        if not left or not right:
            return 0.0

        length = min(len(left), len(right))
        dot_product = 0.0
        left_norm = 0.0
        right_norm = 0.0
        for idx in range(length):
            left_value = float(left[idx])
            right_value = float(right[idx])
            dot_product += left_value * right_value
            left_norm += left_value * left_value
            right_norm += right_value * right_value

        if left_norm == 0.0 or right_norm == 0.0:
            return 0.0

        return dot_product / math.sqrt(left_norm * right_norm)

    def store_chunks(self, stack_id: str, chunks: list[str], source: str = "upload"):
        """Store text chunks into a stack's file."""
        if not chunks:
            return

        embeddings = self.embedder.get_embeddings(chunks)
        records = self._load_records(stack_id)
        for chunk, embedding in zip(chunks, embeddings):
            records.append(
                {
                    "id": f"{source}_{uuid.uuid4().hex[:8]}",
                    "source": source,
                    "text": chunk,
                    "embedding": embedding,
                }
            )

        self._save_records(stack_id, records)
        print(f"--- [LOG] Stored {len(chunks)} chunks into stack {stack_id} ---")

    def search(self, stack_id: str, query: str, top_k: int = 5) -> list[str]:
        """Return the most relevant chunks for a stack query."""
        records = self._load_records(stack_id)
        if not records:
            return []

        query_embedding = self.embedder.get_single_embedding(query)
        scored: list[tuple[float, str]] = []
        for record in records:
            text = record.get("text", "")
            embedding = record.get("embedding", [])
            score = self._cosine_similarity(query_embedding, embedding)
            scored.append((score, text))

        scored.sort(key=lambda item: item[0], reverse=True)
        limit = max(0, min(top_k, len(scored)))
        return [text for _, text in scored[:limit] if text.strip()]
