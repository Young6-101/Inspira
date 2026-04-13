"""
Multimodal CLIP embedder using jina-clip-v1.

Text and images are embedded into the SAME vector space,
enabling cross-modal retrieval (text query → image results, and vice versa).
"""
from io import BytesIO
from PIL import Image
from sentence_transformers import SentenceTransformer
from backend.settings import settings

# Lazy singleton — model is loaded once on first use (~900MB download on first run)
_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
	global _model
	if _model is None:
		print(f"--- [CLIP] Loading model {settings.clip_model} on {settings.clip_device} ---")
		_model = SentenceTransformer(
			settings.clip_model,
			trust_remote_code=True,
			device=settings.clip_device,
		)
		print(f"--- [CLIP] Model loaded successfully ---")
	return _model


class CLIPEmbedder:
	"""Unified text+image embedder via CLIP.

	Both `embed_text()` and `embed_image()` produce vectors in the
	same 768-d space, so cosine similarity across modalities is meaningful.
	"""

	def __init__(self):
		self.model = _get_model()

	# ── Text ────────────────────────────────────────────────

	def embed_texts(self, texts: list[str]) -> list[list[float]]:
		"""Batch embed text chunks."""
		embeddings = self.model.encode(texts, normalize_embeddings=True)
		return embeddings.tolist()

	def embed_text(self, text: str) -> list[float]:
		"""Embed a single text string."""
		return self.embed_texts([text])[0]

	# ── Image ───────────────────────────────────────────────

	def embed_images(self, image_paths: list[str]) -> list[list[float]]:
		"""Batch embed images from file paths."""
		images = [Image.open(p).convert("RGB") for p in image_paths]
		embeddings = self.model.encode(images, normalize_embeddings=True)
		return embeddings.tolist()

	def embed_image(self, image_path: str) -> list[float]:
		"""Embed a single image from file path."""
		return self.embed_images([image_path])[0]

	def embed_image_bytes(self, raw: bytes) -> list[float]:
		"""Embed an image from raw bytes (e.g. from upload)."""
		img = Image.open(BytesIO(raw)).convert("RGB")
		embedding = self.model.encode([img], normalize_embeddings=True)
		return embedding[0].tolist()