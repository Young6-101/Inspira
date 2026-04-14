"""
Hybrid Memory Store using Redis for STM and Mem0 for contextual facts.
"""
import json
import importlib
from datetime import datetime
from typing import Any

from backend.settings import settings
from mem0 import Memory


class MemoryStore:
	"""
	- Short-term memory (STM): recent turns per session stored in Redis.
	- Fact Memory: Mem0 extracts and stores facts using LLM directly into Chroma.
	"""

	def __init__(self):
		self.enabled = settings.memory_enabled
		self.client = None

		if not self.enabled:
			return

		# Redis for STM
		try:
			redis_lib = importlib.import_module("redis")
			self.client = redis_lib.from_url(settings.redis_url, decode_responses=True)
			# Test the connection; if Redis is down, this raises ConnectionError
			self.client.ping()
		except Exception as e:
			print(f"--- [WARN] Redis unavailable ({e}), STM disabled. ---")
			self.client = None


		# Mem0 for intelligent fact extraction
		config = {
			"vector_store": {
				"provider": "chroma",
				"config": {
					"collection_name": "mem0_facts",
					"path": "./inspira_db_memory",
				}
			},
			"llm": {
				"provider": "openai",
				"config": {
					"model": settings.openai_chat_model,
					"api_key": settings.openai_api_key,
				}
			}
		}
		self.mem0 = Memory.from_config(config_dict=config)

	def _stm_key(self, user_id: str, session_id: str) -> str:
		return f"memory:stm:{user_id}:{session_id}"

	def append_turn(self, user_id: str, session_id: str, question: str, answer: str):
		if not self.enabled:
			return

		# 1. STM (Redis)
		if self.client:
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

		# 2. Fact Extraction (Mem0)
		try:
			messages = [
				{"role": "user", "content": question},
				{"role": "assistant", "content": answer}
			]
			self.mem0.add(messages, user_id=user_id)
		except Exception as e:
			print(f"--- [WARN] Mem0 failed to index memory: {e} ---")

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

	def search_facts(self, question: str, user_id: str, limit: int = 5) -> list[str]:
		"""Retrieve relevant intelligent memory facts from Mem0."""
		if not self.enabled:
			return []
		try:
			results = self.mem0.search(question, user_id=user_id, limit=limit)
			facts = []
			for r in results:
				if isinstance(r, dict) and "memory" in r:
					facts.append(r["memory"])
			return facts
		except Exception as e:
			print(f"--- [WARN] Mem0 search failed: {e} ---")
			return []
