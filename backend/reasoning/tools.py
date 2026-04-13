"""
Tool implementations for the LangGraph reasoning pipeline.

Tools:
  - retriever:   CLIP cross-modal retrieval from uploaded materials
  - web_search:  DuckDuckGo web search for supplementary info
  - summarizer:  Condense retrieved context via LLM
  - comparator:  Compare/contrast items in context via LLM
"""
from backend.rag_engine.retriever import InspiraRetriever
from backend.reasoning.model_client import get_llm

_retriever = InspiraRetriever()

# ── Retrieval tools (produce new context) ──────────────────

RETRIEVAL_TOOLS = {"retriever", "web_search"}
PROCESSING_TOOLS = {"summarizer", "comparator"}
ALL_TOOLS = RETRIEVAL_TOOLS | PROCESSING_TOOLS


def retriever_tool(query: str, stack_id: str) -> list[str]:
	"""Cross-modal CLIP retrieval from uploaded materials."""
	print(f"--- [TOOL:retriever] Searching stack={stack_id} ---")
	return _retriever.retrieve(
		stack_id=stack_id,
		query=query,
		text_top_k=5,
		image_top_k=3,
	)


def web_search_tool(query: str, max_results: int = 3) -> list[str]:
	"""Search the web via DuckDuckGo (no API key needed)."""
	try:
		from duckduckgo_search import DDGS
		print(f"--- [TOOL:web_search] Searching: {query[:80]} ---")
		with DDGS() as ddgs:
			results = list(ddgs.text(query, max_results=max_results))
		return [f"[Web: {r['title']}] {r['body']}" for r in results]
	except ImportError:
		print("--- [TOOL:web_search] duckduckgo-search not installed, skipping ---")
		return ["[Web search unavailable: pip install duckduckgo-search]"]
	except Exception as e:
		print(f"--- [TOOL:web_search] Failed: {e} ---")
		return []


# ── Processing tools (transform existing context) ─────────

def summarizer_tool(context: list[str], model: str | None = None) -> str:
	"""Condense retrieved context into a cohesive summary."""
	if not context:
		return ""
	print(f"--- [TOOL:summarizer] Condensing {len(context)} fragments ---")
	llm = get_llm(model=model, temperature=0.3)
	text = "\n\n".join(f"[{i + 1}] {c}" for i, c in enumerate(context))
	response = llm.invoke(
		f"Summarize the following fragments into a concise, structured overview. "
		f"Preserve key details and insights:\n\n{text}"
	)
	return response.content


def comparator_tool(context: list[str], model: str | None = None) -> str:
	"""Compare and contrast items found in context."""
	if not context:
		return ""
	print(f"--- [TOOL:comparator] Comparing {len(context)} fragments ---")
	llm = get_llm(model=model, temperature=0.3)
	text = "\n\n".join(f"[{i + 1}] {c}" for i, c in enumerate(context))
	response = llm.invoke(
		f"Compare and contrast the following items. "
		f"Highlight key similarities, differences, and notable patterns:\n\n{text}"
	)
	return response.content
