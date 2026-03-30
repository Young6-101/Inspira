"""Dependency providers shared by API endpoints."""

import os

from openai import OpenAI

from backend.file_processor.audio_handler import AudioTranscriber
from backend.file_processor.image_handler import ImageDescriber
from backend.rag_engine.vector_store import InspiraVault


_vault = InspiraVault()
_image_describer = ImageDescriber()
_audio_transcriber = AudioTranscriber()
_openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def get_vault() -> InspiraVault:
    return _vault


def get_image_describer() -> ImageDescriber:
    return _image_describer


def get_audio_transcriber() -> AudioTranscriber:
    return _audio_transcriber


def get_openai_client() -> OpenAI:
    return _openai_client
