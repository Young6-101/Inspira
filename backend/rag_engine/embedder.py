"""
Embedding module using OpenAI API.
Replaces local torch/sentence-transformers with OpenAI's text-embedding-3-small.
"""
from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class InspiraEmbedder:
    def __init__(self, model: str = "text-embedding-3-small"):
        self.model = model

    def get_embeddings(self, text_chunks: list[str]) -> list[list[float]]:
        """Batch embed text chunks via OpenAI API."""
        print(f"--- [LOG] Embedding {len(text_chunks)} chunks via OpenAI ---")
        response = client.embeddings.create(
            model=self.model,
            input=text_chunks,
        )
        return [item.embedding for item in response.data]

    def get_single_embedding(self, text: str) -> list[float]:
        """Embed a single text string."""
        response = client.embeddings.create(
            model=self.model,
            input=[text],
        )
        return response.data[0].embedding