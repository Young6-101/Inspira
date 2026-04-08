import json
import importlib
from datetime import datetime
from typing import Any

from backend.settings import settings


class MemoryStore:
    """
    MemoryOS-style three-level memory helper on Redis.
    - Short-term memory (STM): recent turns per session
    - Mid-term memory (MTM): summarized session memories per user+stack
    - Long-term memory (LTM): handled by Chroma in rag_engine/vector_store.py
    """

    def __init__(self):
        self.enabled = settings.memory_enabled
        self.client = None

        if not self.enabled:
            return

        try:
            redis_lib = importlib.import_module("redis")
            self.client = redis_lib.from_url(settings.redis_url, decode_responses=True)
        except Exception:
            # Keep app running even if redis package/server is unavailable.
            self.client = None

    def _stm_key(self, user_id: str, session_id: str) -> str:
        return f"memory:stm:{user_id}:{session_id}"

    def _mtm_key(self, user_id: str, stack_id: str) -> str:
        return f"memory:mtm:{user_id}:{stack_id}"

    def _mtm_index_key(self, user_id: str, stack_id: str) -> str:
        return f"memory:mtm:index:{user_id}:{stack_id}"

    def append_turn(self, user_id: str, session_id: str, question: str, answer: str):
        if not self.client:
            return

        key = self._stm_key(user_id, session_id)
        payload = {
            "ts": datetime.utcnow().isoformat(),
            "q": question,
            "a": answer,
        }
        self.client.rpush(key, json.dumps(payload, ensure_ascii=False))

        window = max(settings.memory_stm_window * 2, 2)
        self.client.ltrim(key, -window, -1)
        self.client.expire(key, settings.memory_stm_ttl_seconds)

    def get_recent_turns(self, user_id: str, session_id: str, max_turns: int | None = None) -> list[dict[str, Any]]:
        if not self.client:
            return []

        max_turns = max_turns or settings.memory_stm_window
        key = self._stm_key(user_id, session_id)
        raw = self.client.lrange(key, -max_turns, -1)

        turns: list[dict[str, Any]] = []
        for item in raw:
            try:
                turns.append(json.loads(item))
            except Exception:
                continue
        return turns

    def upsert_mid_summary(
        self,
        user_id: str,
        stack_id: str,
        session_id: str,
        summary: str,
        importance: float = 0.5,
    ):
        if not self.client:
            return

        item_id = f"{session_id}:{int(datetime.utcnow().timestamp())}"
        data_key = self._mtm_key(user_id, stack_id)
        index_key = self._mtm_index_key(user_id, stack_id)

        payload = {
            "id": item_id,
            "session_id": session_id,
            "summary": summary,
            "importance": importance,
            "updated_at": datetime.utcnow().isoformat(),
        }
        self.client.hset(data_key, item_id, json.dumps(payload, ensure_ascii=False))
        self.client.zadd(index_key, {item_id: importance})

        self.client.expire(data_key, settings.memory_mtm_ttl_seconds)
        self.client.expire(index_key, settings.memory_mtm_ttl_seconds)

    def get_mid_summaries(self, user_id: str, stack_id: str, top_k: int = 3) -> list[dict[str, Any]]:
        if not self.client:
            return []

        data_key = self._mtm_key(user_id, stack_id)
        index_key = self._mtm_index_key(user_id, stack_id)

        item_ids = self.client.zrevrange(index_key, 0, max(top_k - 1, 0))
        results: list[dict[str, Any]] = []

        for item_id in item_ids:
            raw = self.client.hget(data_key, item_id)
            if not raw:
                continue
            try:
                results.append(json.loads(raw))
            except Exception:
                continue

        return results

    def should_summarize(self, user_id: str, session_id: str, threshold_turns: int = 6) -> bool:
        if not self.client:
            return False
        key = self._stm_key(user_id, session_id)
        return self.client.llen(key) >= threshold_turns
