"""
Embedding module supporting both cloud(OpenAI) and local(Ollama) providers.
"""
import json
from urllib.error import HTTPError
from urllib import request
from openai import OpenAI
from backend.settings import settings

openai_client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

class InspiraEmbedder:
    def __init__(self, model: str | None = None, provider: str | None = None):
        self.provider = (provider or settings.embedding_provider).lower()
        self.model = model or (
            settings.ollama_embedding_model if self.provider == "ollama" else settings.openai_embedding_model
        )

    def _embed_openai_batch(self, text_chunks: list[str]) -> list[list[float]]:
        if not openai_client:
            raise RuntimeError("OPENAI_API_KEY is missing for OpenAI embedding provider")

        response = openai_client.embeddings.create(
            model=self.model,
            input=text_chunks,
        )
        return [item.embedding for item in response.data]

    def _embed_ollama_single(self, text: str) -> list[float]:
        def _post_json(url: str, payload: dict):
            req = request.Request(
                url=url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with request.urlopen(req, timeout=settings.ollama_embedding_timeout_seconds) as resp:
                return json.loads(resp.read().decode("utf-8"))

        # Newer Ollama API: /api/embed
        embed_url = f"{settings.ollama_base_url}/api/embed"
        legacy_url = f"{settings.ollama_base_url}/api/embeddings"

        try:
            data = _post_json(embed_url, {"model": self.model, "input": text})

            vectors = data.get("embeddings") or []
            if vectors and isinstance(vectors[0], list):
                return vectors[0]
            raise RuntimeError("Ollama /api/embed returned empty embeddings")

        except HTTPError as e:
            # Fallback for older Ollama API: /api/embeddings
            if e.code != 404:
                raise

            # If /api/embed returned a model-not-found style 404, we still try legacy once,
            # then raise a clear error with both endpoint details.
            embed_error = ""
            try:
                embed_error = e.read().decode("utf-8")
            except Exception:
                embed_error = str(e)

            try:
                legacy_data = _post_json(legacy_url, {"model": self.model, "prompt": text})
                vector = legacy_data.get("embedding")
                if not vector:
                    raise RuntimeError("Ollama legacy /api/embeddings returned empty embedding")
                return vector
            except HTTPError as legacy_err:
                try:
                    legacy_error = legacy_err.read().decode("utf-8")
                except Exception:
                    legacy_error = str(legacy_err)
                raise RuntimeError(
                    f"Ollama embedding failed for model '{self.model}'. "
                    f"embed endpoint error: {embed_error}; legacy endpoint error: {legacy_error}. "
                    "Ensure the model is installed (e.g. `ollama pull nomic-embed-text`)."
                ) from legacy_err

        # Any non-HTTP error from /api/embed should bubble up.

    def get_embeddings(self, text_chunks: list[str]) -> list[list[float]]:
        """Batch embed text chunks via configured provider."""
        if self.provider == "ollama":
            print(f"--- [LOG] Embedding {len(text_chunks)} chunks via Ollama ({self.model}) ---")
            return [self._embed_ollama_single(text) for text in text_chunks]

        print(f"--- [LOG] Embedding {len(text_chunks)} chunks via OpenAI ({self.model}) ---")
        return self._embed_openai_batch(text_chunks)

    def get_single_embedding(self, text: str) -> list[float]:
        """Embed a single text string."""
        if self.provider == "ollama":
            return self._embed_ollama_single(text)

        return self._embed_openai_batch([text])[0]