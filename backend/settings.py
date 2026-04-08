import os
from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv


# Always load backend/.env first, and override stale parent/shell values.
_backend_env = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=_backend_env, override=True)


def _as_bool(value: str | None, default: bool = False) -> bool:
	if value is None:
		return default
	return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
	app_mode: str
	openai_api_key: str | None

	ollama_base_url: str
	ollama_chat_model: str
	ollama_vision_model: str
	ollama_embedding_model: str
	ollama_chat_timeout_seconds: int
	ollama_vision_timeout_seconds: int
	ollama_embedding_timeout_seconds: int

	embedding_provider: str
	openai_embedding_model: str

	redis_url: str
	retrieval_cache_enabled: bool
	retrieval_cache_ttl_seconds: int
	memory_enabled: bool
	memory_stm_window: int
	memory_stm_ttl_seconds: int
	memory_mtm_ttl_seconds: int


def load_settings() -> Settings:
	app_mode = os.getenv("APP_MODE", "cloud").strip().lower()

	return Settings(
		app_mode=app_mode,
		openai_api_key=os.getenv("OPENAI_API_KEY"),
		ollama_base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
		ollama_chat_model=os.getenv("OLLAMA_CHAT_MODEL", "llama3"),
		ollama_vision_model=os.getenv("OLLAMA_VISION_MODEL", "moondream"),
		ollama_embedding_model=os.getenv("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text"),
		ollama_chat_timeout_seconds=int(os.getenv("OLLAMA_CHAT_TIMEOUT_SECONDS", "120")),
		ollama_vision_timeout_seconds=int(os.getenv("OLLAMA_VISION_TIMEOUT_SECONDS", "240")),
		ollama_embedding_timeout_seconds=int(os.getenv("OLLAMA_EMBEDDING_TIMEOUT_SECONDS", "60")),
		embedding_provider=os.getenv(
			"EMBEDDING_PROVIDER",
			"ollama" if app_mode == "local" else "openai"
		).strip().lower(),
		openai_embedding_model=os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"),
		redis_url=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
		retrieval_cache_enabled=_as_bool(os.getenv("RETRIEVAL_CACHE_ENABLED"), default=True),
		retrieval_cache_ttl_seconds=int(os.getenv("RETRIEVAL_CACHE_TTL_SECONDS", "3600")),
		memory_enabled=_as_bool(os.getenv("MEMORY_ENABLED"), default=True),
		memory_stm_window=int(os.getenv("MEMORY_STM_WINDOW", "8")),
		memory_stm_ttl_seconds=int(os.getenv("MEMORY_STM_TTL_SECONDS", "7200")),
		memory_mtm_ttl_seconds=int(os.getenv("MEMORY_MTM_TTL_SECONDS", str(14 * 24 * 3600))),
	)


settings = load_settings()
