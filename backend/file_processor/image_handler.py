"""
Image handler with provider routing:
- cloud: OpenAI GPT-4o vision
- local: Ollama vision model (e.g., moondream)
"""
import base64
import json
from pathlib import Path
from urllib import request
from openai import OpenAI
from backend.settings import settings

openai_client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None


class ImageDescriber:
    def __init__(self, model: str | None = None, provider: str | None = None):
        self.provider = (provider or settings.app_mode).lower()
        if self.provider == "local":
            self.model = model or settings.ollama_vision_model
        else:
            self.model = model or "gpt-4o-mini"

    def _describe_via_openai(self, image_data_b64: str, mime_type: str, prompt: str) -> str:
        if not openai_client:
            raise RuntimeError("OPENAI_API_KEY is missing for OpenAI vision provider")

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

    def _describe_via_ollama(self, image_data_b64: str, prompt: str) -> str:
        payload = json.dumps(
            {
                "model": self.model,
                "prompt": prompt,
                "images": [image_data_b64],
                "stream": False,
            }
        ).encode("utf-8")
        req = request.Request(
            url=f"{settings.ollama_base_url}/api/generate",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with request.urlopen(req, timeout=settings.ollama_vision_timeout_seconds) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return data.get("response", "")

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

            if self.provider == "local":
                desc = self._describe_via_ollama(image_data, prompt)
            else:
                desc = self._describe_via_openai(image_data, mime_type, prompt)

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

            if self.provider == "local":
                return self._describe_via_ollama(image_data, prompt)

            return self._describe_via_openai(image_data, mime_type, prompt)
        except Exception as e:
            print(f"--- [ERROR] Image bytes description failed: {e} ---")
            return f"[Error describing image]"
