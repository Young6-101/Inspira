from typing import Optional
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI
from backend.settings import settings

def get_llm(model: Optional[str] = None, temperature: float = 0.7):
    """
    Initialize and return the LLM client.
    
    Args:
        model: Model name to use (optional; provider default if omitted)
        temperature: Controls randomness in generation (0.0 = deterministic, 1.0 = creative)
    
    Returns:
        ChatOllama: Configured LLM client
    """
    if settings.app_mode == "local":
        return ChatOllama(
            model=model or settings.ollama_chat_model,
            temperature=temperature,
            base_url=settings.ollama_base_url,
        )

    return ChatOpenAI(
        model=model or "gpt-4o-mini",
        temperature=temperature,
        api_key=settings.openai_api_key,
    )
