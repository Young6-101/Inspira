from file_processor.image_handler import ImageDescriber
from rag_engine.vector_store import InspiraVault


class InspiraRetriever:
    """
    Unified retriever: handles both text and image retrieval,
    then enriches image results with visual descriptions.
    """

    def __init__(self):
        self.vault = InspiraVault()
        self.describer = ImageDescriber()

    def retrieve(self, query: str, text_top_k: int = 3, image_top_k: int = 2) -> list[str]:
        """
        Given a user query, retrieve relevant text chunks and
        (if images exist) image-based analysis, return as a unified context list.
        """
        # 1. Text retrieval (bge-m3)
        text_chunks = self.vault.search_clarity(query, top_k=text_top_k)
        combined = text_chunks.copy()

        # 2. Cross-modal image retrieval (jina-clip) — only if images exist in the vault
        try:
            image_count = self.vault.vision_collection.count()
        except Exception:
            image_count = 0

        if image_count > 0:
            image_ids = self.vault.search_vision(query, top_k=image_top_k)
            if image_ids:
                print(f"--- [AGENT] Analyzing {len(image_ids)} visual samples ---")
                pattern_analysis = self.describer.analyze_pattern(image_ids)
                combined.append(f"\n--- Visual Pattern Analysis ---\n{pattern_analysis}\n")

        return combined
