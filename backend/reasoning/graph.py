"""
Main reasoning workflow using LangGraph.

This module orchestrates the RAG-based inspiration generation pipeline:
1. Retrieve relevant context from vector store
2. Generate creative career inspiration using LLM
"""

from langgraph.graph import StateGraph, END
from backend.reasoning.state import GraphState
from backend.reasoning.nodes import memory_retrieve_node, retrieve_node, generate_node, memory_write_node

# Build the Workflow
workflow = StateGraph(GraphState)

# Add nodes
workflow.add_node("memory_retrieve", memory_retrieve_node)
workflow.add_node("retrieve", retrieve_node)
workflow.add_node("generate", generate_node)
workflow.add_node("memory_write", memory_write_node)

# Define the flow
workflow.set_entry_point("memory_retrieve")
workflow.add_edge("memory_retrieve", "retrieve")
workflow.add_edge("retrieve", "generate")
workflow.add_edge("generate", "memory_write")
workflow.add_edge("memory_write", END)

# Compile the graph into an executable app
app = workflow.compile()