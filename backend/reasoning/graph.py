"""
LangGraph reasoning workflow — Inspira's core reasoning engine.

Graph structure:
  memory_retrieve → classify_intent
    ├── "probe"     → probe_user ─────────────────────────→ memory_write → END
    ├── "tool_call" → tool_router → evaluate_retrieval ──┐
    │                     ↑ retry        │ sufficient     │
    │                     └──────────────┘                ├→ generate_response → memory_write → END
    └── "refine"    → refine_context → evaluate_retrieval─┘
"""
from langgraph.graph import StateGraph, END
from backend.reasoning.state import GraphState
from backend.reasoning.nodes import (
	memory_retrieve_node,
	classify_intent_node,
	probe_user_node,
	tool_router_node,
	refine_context_node,
	evaluate_retrieval_node,
	generate_response_node,
	memory_write_node,
	route_by_intent,
	route_by_retrieval,
)

# ── Build graph ──────────────────────────────────────────

workflow = StateGraph(GraphState)

# Add nodes
workflow.add_node("memory_retrieve", memory_retrieve_node)
workflow.add_node("classify_intent", classify_intent_node)
workflow.add_node("probe_user", probe_user_node)
workflow.add_node("tool_router", tool_router_node)
workflow.add_node("refine_context", refine_context_node)
workflow.add_node("evaluate_retrieval", evaluate_retrieval_node)
workflow.add_node("generate_response", generate_response_node)
workflow.add_node("memory_write", memory_write_node)

# ── Wire edges ───────────────────────────────────────────

# Entry
workflow.set_entry_point("memory_retrieve")
workflow.add_edge("memory_retrieve", "classify_intent")

# Intent branching (3 paths)
workflow.add_conditional_edges(
	"classify_intent",
	route_by_intent,
	{
		"probe": "probe_user",
		"tool_call": "tool_router",
		"refine": "refine_context",
	},
)

# Probe → save & return immediately
workflow.add_edge("probe_user", "memory_write")

# Tool execution → evaluation
workflow.add_edge("tool_router", "evaluate_retrieval")

# Refine → evaluation
workflow.add_edge("refine_context", "evaluate_retrieval")

# Evaluation loop: retry tools or proceed to generation
workflow.add_conditional_edges(
	"evaluate_retrieval",
	route_by_retrieval,
	{
		"retry": "tool_router",    # loop back for more context
		"pass": "generate_response",
	},
)

# Generate → save → done
workflow.add_edge("generate_response", "memory_write")
workflow.add_edge("memory_write", END)

# ── Compile ──────────────────────────────────────────────

app = workflow.compile()