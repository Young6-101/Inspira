"""
Image handler — always OpenAI Vision API.

Provides:
  - describe_image / describe_image_bytes: single image → text description
  - analyze_pattern: multiple images → pattern analysis (used by cross-modal retriever)
"""
import base64
from pathlib import Path
from openai import OpenAI
from backend.settings import settings

openai_client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None


class ImageDescriber:
	def __init__(self, model: str | None = None):
		self.model = model or settings.openai_vision_model

	def _describe_via_openai(self, image_data_b64: str, mime_type: str, prompt: str) -> str:
		if not openai_client:
			raise RuntimeError("OPENAI_API_KEY is missing")

		response = openai_client.chat.completions.create(
			model=self.model,
			messages=[{
				"role": "user",
				"content": [
					{"type": "text", "text": prompt},
					{"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{image_data_b64}"}},
				],
			}],
			max_tokens=500,
		)
		return response.choices[0].message.content or ""

	def describe_image(self, image_path: str, prompt: str = "Describe this image in detail.") -> str:
		"""Generate a textual description of an image."""
		try:
			path = Path(image_path)
			if not path.exists():
				return f"[Image not found: {image_path}]"

			with open(image_path, "rb") as f:
				image_data = base64.b64encode(f.read()).decode("utf-8")

			ext = path.suffix.lower()
			mime_map = {
				".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
				".gif": "image/gif", ".webp": "image/webp", ".bmp": "image/bmp",
			}
			mime_type = mime_map.get(ext, "image/png")
			desc = self._describe_via_openai(image_data, mime_type, prompt)
			print(f"--- [LOG] Described image: {path.name} ---")
			return desc

		except Exception as e:
			print(f"--- [ERROR] Image description failed: {e} ---")
			return f"[Error describing image: {image_path}]"

	def describe_image_bytes(
		self, image_bytes: bytes, filename: str = "image",
		prompt: str = "Describe this image in detail.",
	) -> str:
		"""Describe an image directly from bytes."""
		try:
			image_data = base64.b64encode(image_bytes).decode("utf-8")
			ext = Path(filename).suffix.lower()
			mime_map = {
				".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
				".gif": "image/gif", ".webp": "image/webp",
			}
			mime_type = mime_map.get(ext, "image/png")
			return self._describe_via_openai(image_data, mime_type, prompt)
		except Exception as e:
			print(f"--- [ERROR] Image bytes description failed: {e} ---")
			return "[Error describing image]"

	def analyze_pattern(self, image_paths: list[str]) -> str:
		"""Analyze visual patterns across multiple images.

		Used by the cross-modal retriever when CLIP finds images
		matching a text query — this turns those images into
		meaningful textual context for the LLM.
		"""
		if not image_paths:
			return ""

		prompt = (
			"You are analyzing a collection of images that a user has saved. "
			"Identify recurring visual patterns, themes, color palettes, styles, "
			"and aesthetic preferences. Be specific about what connects them."
		)

		descriptions = []
		for path in image_paths:
			desc = self.describe_image(path, prompt="Describe this image concisely.")
			descriptions.append(f"- {Path(path).name}: {desc}")

		# If multiple images, do a synthesis call
		if len(descriptions) > 1 and openai_client:
			synthesis_prompt = (
				f"Here are descriptions of {len(descriptions)} images the user has collected:\n\n"
				+ "\n".join(descriptions) + "\n\n"
				"What visual patterns, themes, or aesthetic preferences connect these images? "
				"Be specific and insightful."
			)
			response = openai_client.chat.completions.create(
				model=self.model,
				messages=[{"role": "user", "content": synthesis_prompt}],
				max_tokens=500,
			)
			return response.choices[0].message.content or "\n".join(descriptions)

		return "\n".join(descriptions)
