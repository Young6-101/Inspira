"""
Audio handler using Gemini audio understanding.
"""
from pathlib import Path

from llm.gemini_client import transcribe_audio_bytes

SUPPORTED_EXTENSIONS = {".mp3", ".wav", ".flac", ".ogg", ".m4a", ".webm", ".mp4", ".mpeg", ".mpga"}


class AudioTranscriber:
    def __init__(self, model: str = "gemini-2.5-flash"):
        self.model = model

    def transcribe(self, audio_path: str, language: str | None = None) -> str:
        """Transcribe audio file via Gemini."""
        path = Path(audio_path)
        if not path.exists():
            print(f"--- [ERROR] Audio file not found: {audio_path} ---")
            return ""

        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            print(f"--- [ERROR] Unsupported audio format: {path.suffix} ---")
            return ""

        try:
            with open(audio_path, "rb") as audio_file:
                audio_bytes = audio_file.read()

            prompt = "Transcribe the audio verbatim. Return only the transcript."
            if language:
                prompt = f"Transcribe the audio in {language}. Return only the transcript."

            transcript = transcribe_audio_bytes(
                audio_bytes,
                filename=path.name,
                prompt=prompt,
                model=self.model,
            )

            print(f"--- [LOG] Transcribed {path.name}: {len(transcript)} chars ---")
            return transcript

        except Exception as e:
            print(f"--- [ERROR] Transcription failed: {e} ---")
            return ""
