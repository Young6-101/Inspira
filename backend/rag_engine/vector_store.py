"""
Vector store using ChromaDB with OpenAI embeddings.
Simplified: text-only storage (images are described as text then stored).
"""
import hashlib
import importlib
import json
import time
import chromadb
from backend.rag_engine.embedder import InspiraEmbedder
from backend.settings import settings
import uuid


class InspiraVault:
    def __init__(self, db_path="./inspira_db"):
        self.client = chromadb.PersistentClient(path=db_path)
        self.embedder = InspiraEmbedder()
        self.cache_client = self._init_cache_client()
        self.cache_enabled = settings.retrieval_cache_enabled and self.cache_client is not None

    def _init_cache_client(self):
        try:
            redis_lib = importlib.import_module("redis")
            return redis_lib.from_url(settings.redis_url, decode_responses=True)
        except Exception:
            return None

    def _normalize_query(self, query: str) -> str:
        return " ".join(query.lower().strip().split())

    def _cache_key(self, stack_id: str, query: str, top_k: int) -> str:
        normalized = self._normalize_query(query)
        digest = hashlib.sha1(normalized.encode("utf-8")).hexdigest()
        return f"retrieval:cache:{stack_id}:{top_k}:{digest}"

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
                "cache_enabled": False,
                "reason": "redis unavailable",
                "requests": 0,
                "hits": 0,
                "misses": 0,
                "hit_rate": 0.0,
                "avg_latency_ms": 0.0,
                "avg_hit_latency_ms": 0.0,
                "avg_miss_latency_ms": 0.0,
                "latency_reduction_percent": 0.0,
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
            "requests": requests,
            "hits": hits,
            "misses": misses,
            "hit_rate": round(hit_rate, 4),
            "avg_latency_ms": round(avg_latency, 2),
            "avg_hit_latency_ms": round(avg_hit_latency, 2),
            "avg_miss_latency_ms": round(avg_miss_latency, 2),
            "latency_reduction_percent": round(latency_reduction * 100, 2),
        }

    def get_collection(self, stack_id: str):
        """Get or create a collection for a specific stack."""
        return self.client.get_or_create_collection(name=f"stack_{stack_id}")

    def store_chunks(self, stack_id: str, chunks: list[str], source: str = "upload"):
        """Store text chunks into a stack's collection."""
        if not chunks:
            return

        collection = self.get_collection(stack_id)
        embeddings = self.embedder.get_embeddings(chunks)
        ids = [f"{source}_{uuid.uuid4().hex[:8]}" for _ in chunks]
        metadatas = [{"source": source}] * len(chunks)

        collection.add(
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids,
        )
        print(f"--- [LOG] Stored {len(chunks)} chunks into stack {stack_id} ---")

    def search(self, stack_id: str, query: str, top_k: int = 5) -> list[str]:
        """Search for relevant chunks in a stack."""
        start = time.perf_counter()
        collection = self.get_collection(stack_id)
        if collection.count() == 0:
            self._record_metrics(hit=False, latency_ms=(time.perf_counter() - start) * 1000)
            return []

        if self.cache_enabled:
            key = self._cache_key(stack_id, query, top_k)
            cached = self.cache_client.get(key)
            if cached:
                docs = json.loads(cached)
                self._record_metrics(hit=True, latency_ms=(time.perf_counter() - start) * 1000)
                return docs

        query_embedding = self.embedder.get_single_embedding(query)
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, collection.count()),
        )
        docs = results["documents"][0] if results["documents"] else []

        if self.cache_enabled:
            key = self._cache_key(stack_id, query, top_k)
            self.cache_client.setex(key, settings.retrieval_cache_ttl_seconds, json.dumps(docs, ensure_ascii=False))

        self._record_metrics(hit=False, latency_ms=(time.perf_counter() - start) * 1000)
        return docs