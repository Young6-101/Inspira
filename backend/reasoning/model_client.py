"""LLM client — always OpenAI API (used in both cloud and local modes)."""
from typing import Optional
from langchain_openai import ChatOpenAI
from backend.settings import settings


def get_llm(model: Optional[str] = None, temperature: float = 0.7):
	"""Initialize and return the LLM client.

	Both cloud and local modes call the OpenAI API.
	Local mode simulates a user running the app on their own machine
	with their own API key.
	"""
	return ChatOpenAI(
		model=model or settings.openai_chat_model,
		temperature=temperature,
		api_key=settings.openai_api_key,
	)
