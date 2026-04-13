"""
LangGraph reasoning nodes.

Pipeline:
  memory_retrieve → classify_intent
    ├── probe_user → memory_write → END
    ├── tool_router → evaluate_retrieval ↔ tool_router → generate_response → memory_write → END
    └── refine_context → evaluate_retrieval ↔ tool_router → generate_response → memory_write → END
"""
import json

from backend.reasoning.memory_store import MemoryStore
from backend.reasoning.model_client import get_llm
from backend.reasoning.state import GraphState
from backend.reasoning.tools import (
	retriever_tool,
	web_search_tool,
	summarizer_tool,
	comparator_tool,
	RETRIEVAL_TOOLS,
	PROCESSING_TOOLS,
)
from backend.settings import settings
from langchain_core.prompts import ChatPromptTemplate

memory_store = MemoryStore()

MAX_RETRIES = 2


# ═══════════════════════════════════════════════════════════
#  1. Memory Retrieve
# ═══════════════════════════════════════════════════════════

def memory_retrieve_node(state: GraphState):
	"""Load STM and personalized facts from Mem0 for this user session."""
	print("--- [NODE] memory_retrieve ---")

	stm_turns = memory_store.get_recent_turns(state["user_id"], state["session_id"])
	mem0_facts = memory_store.search_facts(state["question"], state["user_id"])

	stm_text = "\n".join(
		[f"- Q: {t.get('q', '')}\n  A: {str(t.get('a', ''))[:260]}" for t in stm_turns]
	)
	mtm_text = "\n".join([f"- {fact}" for fact in mem0_facts])

	# Extract last answer for refinement context
	previous_answer = ""
	if stm_turns:
		previous_answer = stm_turns[-1].get("a", "")

	return {
		"stm_text": stm_text,
		"mtm_text": mtm_text,
		"previous_answer": previous_answer,
		"retry_count": 0,
		"context": [],
		"tool_log": [],
	}


# ═══════════════════════════════════════════════════════════
#  2. Classify Intent
# ═══════════════════════════════════════════════════════════

def classify_intent_node(state: GraphState):
	"""Classify user intent → probe | tool_call | refine."""
	print("--- [NODE] classify_intent ---")

	llm = get_llm(model=state.get("model"), temperature=0.0)

	prompt = ChatPromptTemplate.from_messages([
		("system", """You are an intent classifier for 'Inspira', an AI inspiration engine.

Given the user's message and conversation history, classify into exactly ONE of:

- "probe": The user's request is too vague or ambiguous. You need to ask a clarifying question before proceeding. Examples: "help me", "inspire me", "I don't know what I want".

- "tool_call": The user wants information, analysis, pattern discovery, or creative inspiration from their uploaded materials or the web. This is the DEFAULT for most queries. Examples: "what patterns do you see?", "summarize my notes", "compare these styles", "search for minimalist design trends".

- "refine": The user is explicitly requesting adjustments to the PREVIOUS response. There MUST be a previous answer to refine. Examples: "more detail on point 3", "make it shorter", "focus on the color palette", "rewrite in Japanese".

Previous conversation:
{stm_text}

Previous answer (if any):
{previous_answer}

RULES:
- If there is NO previous answer, never classify as "refine"
- When in doubt, use "tool_call"
- Only use "probe" if the query is genuinely too vague to act on

Respond with ONLY the intent label."""),
		("human", "{question}"),
	])

	chain = prompt | llm
	response = chain.invoke({
		"stm_text": state.get("stm_text", "[none]"),
		"previous_answer": state.get("previous_answer", "[no previous answer]")[:500],
		"question": state["question"],
	})

	intent = response.content.strip().lower().replace('"', '').replace("'", "")
	if intent not in ("probe", "tool_call", "refine"):
		intent = "tool_call"

	# Safety: can't refine if no previous answer
	if intent == "refine" and not state.get("previous_answer"):
		intent = "tool_call"

	print(f"--- [INTENT] → {intent} ---")
	return {"intent": intent}


# ═══════════════════════════════════════════════════════════
#  3a. Probe User (ask clarifying question)
# ═══════════════════════════════════════════════════════════

def probe_user_node(state: GraphState):
	"""Generate a clarifying follow-up question and return it as the answer."""
	print("--- [NODE] probe_user ---")

	llm = get_llm(model=state.get("model"), temperature=0.7)

	prompt = ChatPromptTemplate.from_messages([
		("system", """You are 'Inspira', an AI that helps users discover hidden patterns and insights from their uploaded materials.

The user's query is too vague. Ask a focused, helpful follow-up question (MAX 2 SENTENCES) to understand what they're looking for.

Be warm and specific. Suggest concrete directions they could take. 
...
Conversation history:
{stm_text}"""),
		("human", "{question}"),
	])

	chain = prompt | llm
	response = chain.invoke({
		"stm_text": state.get("stm_text", "[none]"),
		"question": state["question"],
	})

	return {"answer": response.content}


# ═══════════════════════════════════════════════════════════
#  3b. Tool Router (select & execute tools)
# ═══════════════════════════════════════════════════════════

def tool_router_node(state: GraphState):
	"""LLM selects tools → execute retrieval tools → execute processing tools."""
	print("--- [NODE] tool_router ---")

	llm = get_llm(model=state.get("model"), temperature=0.0)

	prompt = ChatPromptTemplate.from_messages([
		("system", """You are a tool selector for an AI inspiration engine.

Available tools:
- "retriever": Search the user's uploaded materials (docs, images, audio) via cross-modal CLIP retrieval. Always include this if no context has been retrieved yet.
- "web_search": Search the web for supplementary information not in uploaded materials. Use when the query needs current/external knowledge.
- "summarizer": Condense and synthesize retrieved fragments. Use when there's a lot of context that needs to be distilled.
- "comparator": Compare and contrast different items or concepts. Use when the user wants to understand differences/similarities.

Current state:
- Context fragments already retrieved: {context_count}
- Tools already called this session: {tool_log}
- This is retry #{retry_count} (if > 0, try different/broader tools)

Select 1-3 tools. Respond with ONLY a JSON array, e.g.: ["retriever", "web_search"]

Guidelines:
- If context_count is 0, ALWAYS include "retriever"
- On retries, consider adding "web_search" for broader coverage
- "summarizer" and "comparator" only make sense when there IS context to process"""),
		("human", "{question}"),
	])

	chain = prompt | llm
	response = chain.invoke({
		"question": state["question"],
		"context_count": str(len(state.get("context", []))),
		"tool_log": ", ".join(state.get("tool_log", [])) or "none",
		"retry_count": str(state.get("retry_count", 0)),
	})

	# Parse tool selection
	try:
		raw = response.content.strip()
		start = raw.index("[")
		end = raw.index("]") + 1
		selected = json.loads(raw[start:end])
	except (ValueError, json.JSONDecodeError):
		selected = ["retriever"]

	valid_tools = {"retriever", "web_search", "summarizer", "comparator"}
	selected = [t for t in selected if t in valid_tools]
	if not selected:
		selected = ["retriever"]

	print(f"--- [ROUTER] Selected: {selected} ---")

	# Execute tools
	context = list(state.get("context", []))
	tool_log = list(state.get("tool_log", []))

	# Phase 1: Retrieval tools → produce new context
	for tool_name in selected:
		if tool_name == "retriever":
			results = retriever_tool(state["question"], state["stack_id"])
			context.extend(results)
			tool_log.append("retriever")
		elif tool_name == "web_search":
			results = web_search_tool(state["question"])
			context.extend(results)
			tool_log.append("web_search")

	# Phase 2: Processing tools → transform context
	for tool_name in selected:
		if tool_name == "summarizer" and context:
			summary = summarizer_tool(context, model=state.get("model"))
			context = [f"[Summary]: {summary}"]
			tool_log.append("summarizer")
		elif tool_name == "comparator" and context:
			comparison = comparator_tool(context, model=state.get("model"))
			context.append(f"[Comparison]: {comparison}")
			tool_log.append("comparator")

	return {"context": context, "tool_log": tool_log, "selected_tools": selected}


# ═══════════════════════════════════════════════════════════
#  3c. Refine Context (iterative refinement of previous response)
# ═══════════════════════════════════════════════════════════

def refine_context_node(state: GraphState):
	"""Build context from previous answer + targeted retrieval for refinement."""
	print("--- [NODE] refine_context ---")

	previous = state.get("previous_answer", "")
	question = state["question"]

	context = []
	if previous:
		context.append(f"[Previous Response to Refine]:\n{previous}")

	# Light retrieval targeting the refinement request
	additional = retriever_tool(question, state["stack_id"])
	if additional:
		context.extend(additional)

	tool_log = list(state.get("tool_log", []))
	tool_log.append("refine_retrieval")

	return {"context": context, "tool_log": tool_log}


# ═══════════════════════════════════════════════════════════
#  4. Evaluate Retrieval
# ═══════════════════════════════════════════════════════════

def evaluate_retrieval_node(state: GraphState):
	"""Judge if retrieved context is sufficient. If not → retry via tool_router."""
	print("--- [NODE] evaluate_retrieval ---")

	context = state.get("context", [])
	retry_count = state.get("retry_count", 0)

	# Auto-pass conditions
	if retry_count >= MAX_RETRIES:
		print(f"--- [EVAL] Max retries ({MAX_RETRIES}) reached, proceeding anyway ---")
		return {"retrieval_sufficient": True}

	if not context:
		print("--- [EVAL] Empty context (empty stack?), proceeding ---")
		return {"retrieval_sufficient": True}

	llm = get_llm(model=state.get("model"), temperature=0.0)

	context_preview = "\n".join(c[:300] for c in context[:5])

	prompt = ChatPromptTemplate.from_messages([
		("system", """You are evaluating whether retrieved context is sufficient to answer a user's question.

Retrieved context (preview):
{context_preview}

Total fragments: {count}
Tools used: {tool_log}

Is this context sufficient to provide a helpful, well-grounded answer?

Respond with ONLY "sufficient" or "insufficient".
Say "insufficient" ONLY if critical information is clearly missing and additional retrieval could plausibly help."""),
		("human", "{question}"),
	])

	chain = prompt | llm
	response = chain.invoke({
		"context_preview": context_preview,
		"count": str(len(context)),
		"tool_log": ", ".join(state.get("tool_log", [])),
		"question": state["question"],
	})

	result = response.content.strip().lower()
	sufficient = "insufficient" not in result

	print(f"--- [EVAL] → {'sufficient ✓' if sufficient else 'insufficient ✗'} (attempt {retry_count + 1}/{MAX_RETRIES + 1}) ---")

	return {
		"retrieval_sufficient": sufficient,
		"retry_count": retry_count + 1,
	}


# ═══════════════════════════════════════════════════════════
#  5. Generate Response
# ═══════════════════════════════════════════════════════════

def generate_response_node(state: GraphState):
	"""Final LLM generation with all gathered context."""
	print("--- [NODE] generate_response ---")

	context = state.get("context", [])
	stm_text = state.get("stm_text", "")
	mtm_text = state.get("mtm_text", "")

	if not context and state.get("intent") != "refine":
		system_prompt = (
			"You are 'Inspira', an AI assistant. The user hasn't uploaded any materials to this stack yet, "
			"or no relevant context was found. Let them know they can upload files (PDF, PPT, images, audio, text)."
		)
	else:
		mode_instructions = {
			"patterns": "Identify common themes, recurring patterns, and synthesize a cohesive overview.",
			"summarize": "Provide a concise, structured summary of core points.",
			"compare": "Compare different concepts, highlighting similarities and exact differences.",
			"brainstorm": "Generate creative, out-of-the-box ideas inspired by the context.",
			"custom": "Follow the user's specific query exactly using the context.",
		}
		instruction = mode_instructions.get(state["mode"], mode_instructions["patterns"])
		context_text = "\n\n".join(f"[Fragment {i + 1}]: {c}" for i, c in enumerate(context))

		system_prompt = f"""You are 'Inspira', an AI inspiration engine operating in '{state['mode']}' mode.

INSTRUCTION: {instruction}

Short-term Memory: {stm_text or '[none]'}
Personalized Facts: {mtm_text or '[none]'}
Context: {context_text}"""

	llm = get_llm(model=state.get("model"), temperature=0.7)
	prompt = ChatPromptTemplate.from_messages([
		("system", f"{system_prompt}\n\nCRITICAL: Keep your response concise (max 150 words)."),
		("human", "{question}"),
	])
	
	chain = prompt | llm
	response = chain.invoke({"question": state["question"]})
	answer = response.content
	
	return {"answer": answer}


# ═══════════════════════════════════════════════════════════
#  6. Memory Write
# ═══════════════════════════════════════════════════════════

def memory_write_node(state: GraphState):
	"""Persist Q&A to STM; Mem0 automatically handles long-term fact extraction."""
	print("--- [NODE] memory_write ---")

	answer = state.get("answer", "")
	memory_store.append_turn(state["user_id"], state["session_id"], state["question"], answer)

	return {}


# ═══════════════════════════════════════════════════════════
#  Routing functions (for conditional edges)
# ═══════════════════════════════════════════════════════════

def route_by_intent(state: GraphState) -> str:
	"""Route based on classify_intent result."""
	return state.get("intent", "tool_call")


def route_by_retrieval(state: GraphState) -> str:
	"""Route based on evaluate_retrieval result."""
	if state.get("retrieval_sufficient", True):
		return "pass"
	return "retry"
