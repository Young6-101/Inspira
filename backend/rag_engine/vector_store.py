"""Lightweight RAG store (no SQL DB, no vector DB) using JSONL + OpenAI embeddings."""
import hashlib
import json
import math
import time
import uuid
from pathlib import Path

from backend.file_processor.image_handler import ImageDescriber
from backend.rag_engine.embedder import OpenAITextEmbedder
from backend.settings import settings


def _cosine_similarity(a: list[float], b: list[float]) -> float:
	if not a or not b or len(a) != len(b):
		return -1.0
	dot = sum(x * y for x, y in zip(a, b))
	norm_a = math.sqrt(sum(x * x for x in a))
	norm_b = math.sqrt(sum(y * y for y in b))
	if norm_a == 0 or norm_b == 0:
		return -1.0
	return dot / (norm_a * norm_b)


def _lexical_score(query: str, text: str) -> float:
	q_terms = {t for t in query.lower().split() if t}
	t_terms = {t for t in text.lower().split() if t}
	if not q_terms or not t_terms:
		return 0.0
	inter = len(q_terms & t_terms)
	return inter / max(1, len(q_terms))


class InspiraVault:
	def __init__(self, db_path: str = "./inspira_rag_store"):
		self.root = Path(db_path)
		self.root.mkdir(parents=True, exist_ok=True)
		self._embedder = None
		self.describer = ImageDescriber()
		self.cache_client = self._init_cache_client()
		self.cache_enabled = settings.retrieval_cache_enabled and self.cache_client is not None

	@property
	def embedder(self):
		if self._embedder is None:
			self._embedder = OpenAITextEmbedder()
		return self._embedder

	def _stack_file(self, stack_id: str) -> Path:
		return self.root / f"stack_{stack_id}.jsonl"

	def _init_cache_client(self):
		try:
			import redis
			client = redis.from_url(settings.redis_url, decode_responses=True)
			client.ping()
			return client
		except Exception:
			return None

	def _normalize_query(self, query: str) -> str:
		return " ".join(query.lower().strip().split())

	def _cache_key(self, stack_id: str, query: str, top_k: int) -> str:
		digest = hashlib.sha1(self._normalize_query(query).encode("utf-8")).hexdigest()
		return f"retrieval:cache:text:{stack_id}:{top_k}:{digest}"

	def _load_records(self, stack_id: str) -> list[dict]:
		path = self._stack_file(stack_id)
		if not path.exists():
			return []
		records = []
		with path.open("r", encoding="utf-8") as fp:
			for line in fp:
				line = line.strip()
				if not line:
					continue
				records.append(json.loads(line))
		return records

	def _append_records(self, stack_id: str, records: list[dict]) -> None:
		if not records:
			return
		path = self._stack_file(stack_id)
		path.parent.mkdir(parents=True, exist_ok=True)
		with path.open("a", encoding="utf-8") as fp:
			for row in records:
				fp.write(json.dumps(row, ensure_ascii=False) + "\n")

	def store_chunks(self, stack_id: str, chunks: list[str], source: str = "upload"):
		if not chunks:
			return
		try:
			embeddings = self.embedder.embed_texts(chunks)
		except Exception as e:
			print(f"--- [VAULT][WARN] Embedding failed, using lexical-only fallback: {e} ---")
			embeddings = [[] for _ in chunks]
		records = []
		for chunk, emb in zip(chunks, embeddings):
			records.append({
				"id": f"{source}_{uuid.uuid4().hex[:8]}",
				"source": source,
				"type": "text",
				"document": chunk,
				"embedding": emb,
			})
		self._append_records(stack_id, records)
		print(f"--- [VAULT] Stored {len(records)} text chunks → stack {stack_id} ---")

	def store_image_bytes(self, stack_id: str, image_bytes: bytes, source: str = "upload", save_path: str = ""):
		# No local image embedding: convert image to text via OpenAI vision, then store as text chunk.
		desc = self.describer.describe_image_bytes(
			image_bytes=image_bytes,
			filename=source,
			prompt="Describe key visual elements and potential themes in this image.",
		)
		if not desc.strip():
			return
		prefix = f"[Image Description: {source}]"
		if save_path:
			prefix += f" [path: {save_path}]"
		self.store_chunks(stack_id, [f"{prefix}\n{desc}"], source=source)

	def search_text(self, stack_id: str, query: str, top_k: int = 5) -> list[str]:
		start = time.perf_counter()
		records = self._load_records(stack_id)
		if not records:
			return []

		if self.cache_enabled:
			key = self._cache_key(stack_id, query, top_k)
			cached = self.cache_client.get(key) if self.cache_client else None
			if cached:
				return json.loads(str(cached))

		query_emb: list[float] | None
		try:
			query_emb = self.embedder.embed_text(query)
		except Exception as e:
			print(f"--- [VAULT][WARN] Query embedding failed, using lexical fallback: {e} ---")
			query_emb = None
		scored = []
		for row in records:
			row_embedding = row.get("embedding", [])
			if query_emb and row_embedding:
				score = _cosine_similarity(query_emb, row_embedding)
			else:
				score = _lexical_score(query, row.get("document", ""))
			scored.append((score, row.get("document", "")))

		scored.sort(key=lambda x: x[0], reverse=True)
		docs = [doc for score, doc in scored[:max(1, top_k)] if doc]

		if self.cache_enabled:
			key = self._cache_key(stack_id, query, top_k)
			if self.cache_client:
				self.cache_client.setex(key, settings.retrieval_cache_ttl_seconds, json.dumps(docs, ensure_ascii=False))

		elapsed_ms = (time.perf_counter() - start) * 1000
		print(f"--- [VAULT] search_text stack={stack_id} top_k={top_k} in {elapsed_ms:.1f}ms ---")
		return docs

	def search_images(self, stack_id: str, query: str, top_k: int = 3) -> list[dict]:
		# Disabled in OpenAI-only mode; images are converted to text and searched via search_text().
		return []

	def search(self, stack_id: str, query: str, top_k: int = 5) -> list[str]:
		return self.search_text(stack_id, query, top_k)
