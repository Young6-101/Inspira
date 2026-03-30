"""Application configuration values."""

import os


PORT = int(os.getenv("PORT", "8000"))

_DEFAULT_CORS_ORIGINS = ["http://localhost:3000", "http://localhost:5173", "*"]
_raw_cors_origins = os.getenv("CORS_ORIGINS", "")

if _raw_cors_origins.strip():
	CORS_ORIGINS = [origin.strip() for origin in _raw_cors_origins.split(",") if origin.strip()]
else:
	CORS_ORIGINS = _DEFAULT_CORS_ORIGINS

