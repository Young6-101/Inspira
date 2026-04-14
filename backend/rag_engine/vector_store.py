"""
Dual-collection vector store using ChromaDB + CLIP embeddings.

Collections per stack:
  - stack_{id}       : text chunks (CLIP text vectors)
  - stack_{id}_images: image entries (CLIP image vectors)

Both collections share the same 768-d CLIP vector space,
so a text query embedding can retrieve from BOTH collections.
"""
import hashlib
import json
import time
import uuid

import chromadb
from backend.rag_engine.embedder import CLIPEmbedder
from backend.settings import settings


class InspiraVault:
	def __init__(self, db_path="./inspira_db_vault"): # 分开存储，避免冲突
		self.client = chromadb.PersistentClient(path=db_path)
		self._embedder = None
		self.cache_client = self._init_cache_client()
		self.cache_enabled = settings.retrieval_cache_enabled and self.cache_client is not None

	@property
	def embedder(self):
		if self._embedder is None:
			self._embedder = CLIPEmbedder()
		return self._embedder

	# ── Cache helpers (unchanged) ──────────────────────────

	def _init_cache_client(self):
		try:
			import redis
			client = redis.from_url(settings.redis_url, decode_responses=True)
			client.ping()  
			return client
		except Exception as e:
			print(f"--- [WARN] Redis unavailable ({e}), Retrieval Cache disabled. ---")
			return None

	def _normalize_query(self, query: str) -> str:
		return " ".join(query.lower().strip().split())

	def _cache_key(self, stack_id: str, query: str, top_k: int, scope: str = "text") -> str:
		normalized = self._normalize_query(query)
		digest = hashlib.sha1(normalized.encode("utf-8")).hexdigest()
		return f"retrieval:cache:{scope}:{stack_id}:{top_k}:{digest}"

	def _metrics_key(self) -> str:
		return "retrieval:cache:metrics"

	def _record_metrics(self, hit: bool, latency_ms: float):
		if not self.cache_client:
			return
		key = self._metrics_key()
		pipe = self.cache_client.pipeline()
		pipe.hincrby(key, "requests", 1)
		pipe.hincrbyfloat(key, "latency_ms_total", round(latency_ms, 3))
		if hit:
			pipe.hincrby(key, "hits", 1)
			pipe.hincrbyfloat(key, "hit_latency_ms_total", round(latency_ms, 3))
		else:
			pipe.hincrby(key, "misses", 1)
			pipe.hincrbyfloat(key, "miss_latency_ms_total", round(latency_ms, 3))
		pipe.execute()

	def get_cache_metrics(self) -> dict:
		if not self.cache_client:
			return {
				"cache_enabled": False, "reason": "redis unavailable",
				"requests": 0, "hits": 0, "misses": 0, "hit_rate": 0.0,
				"avg_latency_ms": 0.0, "avg_hit_latency_ms": 0.0,
				"avg_miss_latency_ms": 0.0, "latency_reduction_percent": 0.0,
			}
		raw = self.cache_client.hgetall(self._metrics_key())
		requests = int(float(raw.get("requests", 0)))
		hits = int(float(raw.get("hits", 0)))
		misses = int(float(raw.get("misses", 0)))
		latency_total = float(raw.get("latency_ms_total", 0.0))
		hit_latency_total = float(raw.get("hit_latency_ms_total", 0.0))
		miss_latency_total = float(raw.get("miss_latency_ms_total", 0.0))
		avg_latency = latency_total / requests if requests else 0.0
		avg_hit_latency = hit_latency_total / hits if hits else 0.0
		avg_miss_latency = miss_latency_total / misses if misses else 0.0
		hit_rate = hits / requests if requests else 0.0
		latency_reduction = 0.0
		if avg_miss_latency > 0 and avg_hit_latency > 0:
			latency_reduction = max(0.0, (avg_miss_latency - avg_hit_latency) / avg_miss_latency)
		return {
			"cache_enabled": self.cache_enabled,
			"requests": requests, "hits": hits, "misses": misses,
			"hit_rate": round(hit_rate, 4),
			"avg_latency_ms": round(avg_latency, 2),
			"avg_hit_latency_ms": round(avg_hit_latency, 2),
			"avg_miss_latency_ms": round(avg_miss_latency, 2),
			"latency_reduction_percent": round(latency_reduction * 100, 2),
		}

	# ── Collections ────────────────────────────────────────

	def get_text_collection(self, stack_id: str):
		"""Text chunks collection (backward-compat name: stack_{id})."""
		return self.client.get_or_create_collection(
			name=f"stack_{stack_id}",
			metadata={"hnsw:space": "cosine"},
		)

	def get_image_collection(self, stack_id: str):
		"""Image embeddings collection."""
		return self.client.get_or_create_collection(
			name=f"stack_{stack_id}_images",
			metadata={"hnsw:space": "cosine"},
		)

	# backward compat alias
	def get_collection(self, stack_id: str):
		return self.get_text_collection(stack_id)

	# ── Store ──────────────────────────────────────────────

	def store_chunks(self, stack_id: str, chunks: list[str], source: str = "upload"):
		"""Embed and store text chunks via CLIP text encoder."""
		if not chunks:
			return
		collection = self.get_text_collection(stack_id)
		embeddings = self.embedder.embed_texts(chunks)
		ids = [f"{source}_{uuid.uuid4().hex[:8]}" for _ in chunks]
		metadatas = [{"source": source, "type": "text"}] * len(chunks)
		collection.add(
			documents=chunks,
			embeddings=embeddings,
			metadatas=metadatas,
			ids=ids,
		)
		print(f"--- [VAULT] Stored {len(chunks)} text chunks → stack {stack_id} ---")

	def store_image(self, stack_id: str, image_path: str, source: str = "upload"):
		"""Embed raw image via CLIP image encoder and store in image collection."""
		collection = self.get_image_collection(stack_id)
		embedding = self.embedder.embed_image(image_path)
		doc_id = f"img_{uuid.uuid4().hex[:8]}"
		collection.add(
			embeddings=[embedding],
			metadatas=[{"source": source, "type": "image", "path": image_path}],
			ids=[doc_id],
			documents=[f"[Image: {source}]"],
		)
		print(f"--- [VAULT] Stored image embedding → stack {stack_id} ({source}) ---")

	def store_image_bytes(self, stack_id: str, image_bytes: bytes, source: str = "upload", save_path: str = ""):
		"""Embed raw image bytes via CLIP image encoder."""
		collection = self.get_image_collection(stack_id)
		embedding = self.embedder.embed_image_bytes(image_bytes)
		doc_id = f"img_{uuid.uuid4().hex[:8]}"
		meta = {"source": source, "type": "image"}
		if save_path:
			meta["path"] = save_path
		collection.add(
			embeddings=[embedding],
			metadatas=[meta],
			ids=[doc_id],
			documents=[f"[Image: {source}]"],
		)
		print(f"--- [VAULT] Stored image bytes embedding → stack {stack_id} ({source}) ---")

	# ── Search ─────────────────────────────────────────────

	def search_text(self, stack_id: str, query: str, top_k: int = 5) -> list[str]:
		"""Search text collection with CLIP text embedding of the query."""
		start = time.perf_counter()
		collection = self.get_text_collection(stack_id)
		if collection.count() == 0:
			self._record_metrics(hit=False, latency_ms=(time.perf_counter() - start) * 1000)
			return []

		if self.cache_enabled:
			key = self._cache_key(stack_id, query, top_k, scope="text")
			cached = self.cache_client.get(key)
			if cached:
				self._record_metrics(hit=True, latency_ms=(time.perf_counter() - start) * 1000)
				return json.loads(cached)

		query_emb = self.embedder.embed_text(query)
		results = collection.query(
			query_embeddings=[query_emb],
			n_results=min(top_k, collection.count()),
		)
		docs = results["documents"][0] if results["documents"] else []

		if self.cache_enabled:
			key = self._cache_key(stack_id, query, top_k, scope="text")
			self.cache_client.setex(key, settings.retrieval_cache_ttl_seconds, json.dumps(docs, ensure_ascii=False))

		self._record_metrics(hit=False, latency_ms=(time.perf_counter() - start) * 1000)
		return docs

	def search_images(self, stack_id: str, query: str, top_k: int = 3) -> list[dict]:
		"""Cross-modal search: text query → image collection.

		Returns list of dicts with 'metadata' and 'distance' keys.
		This works because CLIP text and image embeddings share the same space.
		"""
		collection = self.get_image_collection(stack_id)
		if collection.count() == 0:
			return []

		# Encode the text query with CLIP text encoder — same space as image embeddings!
		query_emb = self.embedder.embed_text(query)
		results = collection.query(
			query_embeddings=[query_emb],
			n_results=min(top_k, collection.count()),
		)

		items = []
		if results["metadatas"] and results["distances"]:
			for meta, dist in zip(results["metadatas"][0], results["distances"][0]):
				items.append({"metadata": meta, "distance": dist})
		return items

	# backward compat
	def search(self, stack_id: str, query: str, top_k: int = 5) -> list[str]:
		return self.search_text(stack_id, query, top_k)
