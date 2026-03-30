"""
Embedding module using Gemini API.
"""
import os
from llm.gemini_client import embed_texts

class InspiraEmbedder:
    def __init__(self, model: str = "gemini-embedding-001"):
        self.model = model
        self.output_dimensionality = int(os.getenv("GEMINI_EMBED_DIMENSION", "768"))

    def get_embeddings(self, text_chunks: list[str]) -> list[list[float]]:
        """Batch embed text chunks via Gemini API."""
        print(f"--- [LOG] Embedding {len(text_chunks)} chunks via Gemini ---")
        return embed_texts(
            text_chunks,
            model=self.model,
            output_dimensionality=self.output_dimensionality,
        )

    def get_single_embedding(self, text: str) -> list[float]:
        """Embed a single text string."""
        return self.get_embeddings([text])[0]
