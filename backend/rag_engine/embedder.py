"""OpenAI text embedding helper for lightweight RAG (no local vector DB)."""
from openai import OpenAI
from backend.settings import settings


class OpenAITextEmbedder:
	"""Text embedder backed by OpenAI embeddings API."""

	def __init__(self, model: str = "text-embedding-3-small"):
		if not settings.openai_api_key:
			raise RuntimeError("OPENAI_API_KEY is missing")
		self.client = OpenAI(api_key=settings.openai_api_key)
		self.model = model

	def embed_texts(self, texts: list[str]) -> list[list[float]]:
		if not texts:
			return []
		response = self.client.embeddings.create(model=self.model, input=texts)
		return [item.embedding for item in response.data]

	def embed_text(self, text: str) -> list[float]:
		if not text:
			return []
		return self.embed_texts([text])[0]