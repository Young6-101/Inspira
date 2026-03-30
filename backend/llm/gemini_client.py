import os
from functools import lru_cache
from pathlib import Path
from typing import Sequence

from google import genai
from google.genai import types

DEFAULT_CHAT_MODEL = os.getenv("GEMINI_CHAT_MODEL", "gemini-2.5-flash")
DEFAULT_EMBED_MODEL = os.getenv("GEMINI_EMBED_MODEL", "gemini-embedding-001")
DEFAULT_VISION_MODEL = os.getenv("GEMINI_VISION_MODEL", DEFAULT_CHAT_MODEL)
DEFAULT_AUDIO_MODEL = os.getenv("GEMINI_AUDIO_MODEL", DEFAULT_CHAT_MODEL)
DEFAULT_EMBED_DIMENSION = int(os.getenv("GEMINI_EMBED_DIMENSION", "768"))

MODEL_ALIASES = {
    "gpt-4o-mini": DEFAULT_CHAT_MODEL,
    "gpt-4o": "gemini-2.5-pro",
    "gpt-3.5-turbo": DEFAULT_CHAT_MODEL,
    "gemini-flash": DEFAULT_CHAT_MODEL,
    "gemini-pro": "gemini-2.5-pro",
}


@lru_cache(maxsize=1)
def get_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if api_key:
        return genai.Client(api_key=api_key)
    return genai.Client()


def normalize_model_name(model: str | None, default_model: str = DEFAULT_CHAT_MODEL) -> str:
    if not model:
        return default_model
    normalized = model.strip()
    return MODEL_ALIASES.get(normalized, normalized)


def _generate_content(
    contents,
    *,
    model: str,
    system_instruction: str | None = None,
    temperature: float | None = None,
    max_output_tokens: int | None = None,
):
    config_kwargs = {}
    if system_instruction:
        config_kwargs["system_instruction"] = system_instruction
    if temperature is not None:
        config_kwargs["temperature"] = temperature
    if max_output_tokens is not None:
        config_kwargs["max_output_tokens"] = max_output_tokens

    config = types.GenerateContentConfig(**config_kwargs) if config_kwargs else None
    return get_client().models.generate_content(
        model=normalize_model_name(model),
        contents=contents,
        config=config,
    )


def generate_text(
    prompt: str,
    *,
    system_instruction: str | None = None,
    model: str | None = None,
    temperature: float = 0.7,
    max_output_tokens: int = 1000,
) -> str:
    response = _generate_content(
        prompt,
        model=model or DEFAULT_CHAT_MODEL,
        system_instruction=system_instruction,
        temperature=temperature,
        max_output_tokens=max_output_tokens,
    )
    return response.text or ""


def image_mime_type(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    return {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".heic": "image/heic",
        ".heif": "image/heif",
        ".bmp": "image/bmp",
    }.get(ext, "image/png")


def audio_mime_type(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    return {
        ".mp3": "audio/mpeg",
        ".mpeg": "audio/mpeg",
        ".mpga": "audio/mpeg",
        ".wav": "audio/wav",
        ".flac": "audio/flac",
        ".ogg": "audio/ogg",
        ".m4a": "audio/mp4",
        ".mp4": "audio/mp4",
        ".webm": "audio/webm",
    }.get(ext, "audio/mpeg")


def describe_image_bytes(
    image_bytes: bytes,
    *,
    filename: str = "image",
    prompt: str = "Describe this image in detail.",
    model: str | None = None,
) -> str:
    image_part = types.Part.from_bytes(
        data=image_bytes,
        mime_type=image_mime_type(filename),
    )
    response = _generate_content(
        [prompt, image_part],
        model=model or DEFAULT_VISION_MODEL,
        temperature=0.2,
        max_output_tokens=500,
    )
    return response.text or ""


def transcribe_audio_bytes(
    audio_bytes: bytes,
    *,
    filename: str = "audio",
    prompt: str = "Transcribe the audio verbatim. Return only the transcript.",
    model: str | None = None,
) -> str:
    audio_part = types.Part.from_bytes(
        data=audio_bytes,
        mime_type=audio_mime_type(filename),
    )
    response = _generate_content(
        [prompt, audio_part],
        model=model or DEFAULT_AUDIO_MODEL,
        temperature=0.0,
        max_output_tokens=1500,
    )
    return response.text or ""


def embed_texts(
    texts: Sequence[str],
    *,
    model: str | None = None,
    output_dimensionality: int = DEFAULT_EMBED_DIMENSION,
) -> list[list[float]]:
    config = types.EmbedContentConfig(output_dimensionality=output_dimensionality)
    response = get_client().models.embed_content(
        model=model or DEFAULT_EMBED_MODEL,
        contents=list(texts),
        config=config,
    )
    return [list(item.values) for item in response.embeddings]
