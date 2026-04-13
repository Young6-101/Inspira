"""
Unified cross-modal retriever.

Searches BOTH text and image collections, then enriches image hits
with vision-model descriptions to provide rich context to the LLM.
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
		"""Cross-modal retrieval: text query → text chunks + image analysis.

		1. CLIP text embed query → search text_collection → text chunks
		2. CLIP text embed query → search image_collection → matched images
		   (works because CLIP text & image vectors share the same space)
		3. Send matched images to vision model for pattern analysis
		4. Return unified context list
		"""
		# 1. Text retrieval
		text_chunks = self.vault.search_text(stack_id, query, top_k=text_top_k)
		combined = text_chunks.copy()

		# 2. Cross-modal image retrieval
		image_hits = self.vault.search_images(stack_id, query, top_k=image_top_k)

		if image_hits:
			# Collect image paths from metadata
			image_paths = [
				hit["metadata"]["path"]
				for hit in image_hits
				if hit["metadata"].get("path")
			]
			if image_paths:
				print(f"--- [RETRIEVER] Cross-modal hit: {len(image_paths)} images for query ---")
				# Use vision model to describe matched images and analyze patterns
				pattern_analysis = self.describer.analyze_pattern(image_paths)
				combined.append(
					f"\n--- Cross-Modal Visual Pattern Analysis ---\n{pattern_analysis}\n"
				)

		return combined
