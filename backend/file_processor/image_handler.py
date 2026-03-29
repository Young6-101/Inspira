"""
Image handler using OpenAI GPT-4o vision.
Replaces local Ollama moondream model.
"""
import base64
import os
from pathlib import Path
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class ImageDescriber:
    def __init__(self, model: str = "gpt-4o-mini"):
        self.model = model

    def describe_image(self, image_path: str, prompt: str = "Describe this image in detail.") -> str:
        """Generate a textual description of an image using GPT-4o vision."""
        try:
            path = Path(image_path)
            if not path.exists():
                return f"[Image not found: {image_path}]"

            with open(image_path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode("utf-8")

            # Determine MIME type
            ext = path.suffix.lower()
            mime_map = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                        ".gif": "image/gif", ".webp": "image/webp", ".bmp": "image/bmp"}
            mime_type = mime_map.get(ext, "image/png")

            response = client.chat.completions.create(
                model=self.model,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {
                            "url": f"data:{mime_type};base64,{image_data}"
                        }},
                    ],
                }],
                max_tokens=500,
            )
            desc = response.choices[0].message.content
            print(f"--- [LOG] Described image: {path.name} ---")
            return desc

        except Exception as e:
            print(f"--- [ERROR] Image description failed: {e} ---")
            return f"[Error describing image: {image_path}]"

    def describe_image_bytes(self, image_bytes: bytes, filename: str = "image",
                              prompt: str = "Describe this image in detail.") -> str:
        """Describe an image directly from bytes (no temp file needed)."""
        try:
            image_data = base64.b64encode(image_bytes).decode("utf-8")
            ext = Path(filename).suffix.lower()
            mime_map = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                        ".gif": "image/gif", ".webp": "image/webp"}
            mime_type = mime_map.get(ext, "image/png")

            response = client.chat.completions.create(
                model=self.model,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {
                            "url": f"data:{mime_type};base64,{image_data}"
                        }},
                    ],
                }],
                max_tokens=500,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"--- [ERROR] Image bytes description failed: {e} ---")
            return f"[Error describing image]"
