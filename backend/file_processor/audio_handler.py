"""
Audio handler using OpenAI Whisper API.
Replaces local faster-whisper model.
"""
import os
from pathlib import Path
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SUPPORTED_EXTENSIONS = {".mp3", ".wav", ".flac", ".ogg", ".m4a", ".webm", ".mp4", ".mpeg", ".mpga"}


class AudioTranscriber:
    def __init__(self, model: str = "whisper-1"):
        self.model = model

    def transcribe(self, audio_path: str, language: str | None = None) -> str:
        """Transcribe audio file via OpenAI Whisper API."""
        path = Path(audio_path)
        if not path.exists():
            print(f"--- [ERROR] Audio file not found: {audio_path} ---")
            return ""

        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            print(f"--- [ERROR] Unsupported audio format: {path.suffix} ---")
            return ""

        try:
            with open(audio_path, "rb") as audio_file:
                kwargs = {"model": self.model, "file": audio_file}
                if language:
                    kwargs["language"] = language

                response = client.audio.transcriptions.create(**kwargs)

            print(f"--- [LOG] Transcribed {path.name}: {len(response.text)} chars ---")
            return response.text

        except Exception as e:
            print(f"--- [ERROR] Transcription failed: {e} ---")
            return ""
