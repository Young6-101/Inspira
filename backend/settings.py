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
	app_mode: str  # "cloud" or "local" — controls deployment context only

	# --- OpenAI API (used in both modes) ---
	openai_api_key: str | None
	openai_chat_model: str
	openai_vision_model: str

	# --- CLIP model (runs locally in both modes via sentence-transformers) ---
	clip_model: str
	clip_device: str  # "cpu", "cuda", "mps"

	# --- Redis & cache ---
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
		openai_chat_model=os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini"),
		openai_vision_model=os.getenv("OPENAI_VISION_MODEL", "gpt-4o-mini"),
		clip_model=os.getenv("CLIP_MODEL", "jinaai/jina-clip-v1"),
		clip_device=os.getenv("CLIP_DEVICE", "cpu"),
		redis_url=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
		retrieval_cache_enabled=_as_bool(os.getenv("RETRIEVAL_CACHE_ENABLED"), default=True),
		retrieval_cache_ttl_seconds=int(os.getenv("RETRIEVAL_CACHE_TTL_SECONDS", "3600")),
		memory_enabled=_as_bool(os.getenv("MEMORY_ENABLED"), default=True),
		memory_stm_window=int(os.getenv("MEMORY_STM_WINDOW", "8")),
		memory_stm_ttl_seconds=int(os.getenv("MEMORY_STM_TTL_SECONDS", "7200")),
		memory_mtm_ttl_seconds=int(os.getenv("MEMORY_MTM_TTL_SECONDS", str(14 * 24 * 3600))),
	)


settings = load_settings()
