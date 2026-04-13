from typing import NotRequired, TypedDict


class GraphState(TypedDict):
	"""State flowing through the LangGraph reasoning pipeline.

	Flow: memory_retrieve → classify_intent → [probe | tool_router | refine]
	      → evaluate_retrieval ↔ tool_router → generate_response → memory_write
	"""

	# ── Input ──
	question: str
	stack_id: str
	user_id: str
	session_id: str
	mode: str
	model: str

	# ── Memory ──
	stm_text: NotRequired[str]
	mtm_text: NotRequired[str]
	previous_answer: NotRequired[str]  # last answer from STM, used for refine

	# ── Intent classification ──
	intent: NotRequired[str]  # "probe" | "tool_call" | "refine"

	# ── Retrieval & tools ──
	context: NotRequired[list[str]]  # accumulated context fragments
	selected_tools: NotRequired[list[str]]
	tool_log: NotRequired[list[str]]  # track which tools were called

	# ── Evaluation loop ──
	retrieval_sufficient: NotRequired[bool]
	retry_count: NotRequired[int]  # prevent infinite loops

	# ── Output ──
	answer: NotRequired[str]
