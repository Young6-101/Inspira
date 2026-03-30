"""
Image handler using Gemini vision.
"""
from pathlib import Path

from llm.gemini_client import describe_image_bytes


class ImageDescriber:
    def __init__(self, model: str = "gemini-2.5-flash"):
        self.model = model

    def describe_image(self, image_path: str, prompt: str = "Describe this image in detail.") -> str:
        """Generate a textual description of an image using Gemini vision."""
        try:
            path = Path(image_path)
            if not path.exists():
                return f"[Image not found: {image_path}]"

            with open(image_path, "rb") as f:
                image_bytes = f.read()

            desc = describe_image_bytes(
                image_bytes,
                filename=path.name,
                prompt=prompt,
                model=self.model,
            )
            print(f"--- [LOG] Described image: {path.name} ---")
            return desc

        except Exception as e:
            print(f"--- [ERROR] Image description failed: {e} ---")
            return f"[Error describing image: {image_path}]"

    def describe_image_bytes(self, image_bytes: bytes, filename: str = "image",
                              prompt: str = "Describe this image in detail.") -> str:
        """Describe an image directly from bytes (no temp file needed)."""
        try:
            return describe_image_bytes(
                image_bytes,
                filename=filename,
                prompt=prompt,
                model=self.model,
            )
        except Exception as e:
            print(f"--- [ERROR] Image bytes description failed: {e} ---")
            return f"[Error describing image]"
