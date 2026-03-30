"""Middleware setup for FastAPI app."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ..core.config import CORS_ORIGINS


def setup_middleware(app: FastAPI) -> None:
	"""Register shared middlewares."""
	app.add_middleware(
		CORSMiddleware,
		allow_origins=CORS_ORIGINS,
		allow_credentials=True,
		allow_methods=["*"],
		allow_headers=["*"],
	)

