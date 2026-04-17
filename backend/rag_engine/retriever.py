"""Unified retriever in OpenAI-embedding mode.

Images are converted to text at ingest time, so retrieval is text-first.
"""
from backend.rag_engine.vector_store import InspiraVault
from backend.file_processor.image_handler import ImageDescriber


class InspiraRetriever:
	def __init__(self):
		self.vault = InspiraVault()
		self.describer = ImageDescriber()

	def retrieve(
		self,
		stack_id: str,
		query: str,
		text_top_k: int = 5,
		image_top_k: int = 3,
	) -> list[str]:
		"""Text retrieval from OpenAI-embedded chunks."""
		# Text retrieval
		text_chunks = self.vault.search_text(stack_id, query, top_k=text_top_k)
		return text_chunks.copy()
