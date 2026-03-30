"""
Main reasoning workflow using LangGraph.

This module orchestrates the RAG-based inspiration generation pipeline:
1. Retrieve relevant context from vector store
2. Generate creative career inspiration using LLM
"""

from langgraph.graph import StateGraph, END
from reasoning.nodes import generate_node, retrieve_node
from reasoning.state import GraphState

# Build the Workflow
workflow = StateGraph(GraphState)

# Add nodes
workflow.add_node("retrieve", retrieve_node)
workflow.add_node("generate", generate_node)

# Define the flow
workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "generate")  # Retrieve -> Generate
workflow.add_edge("generate", END)         # Generate -> End

# Compile the graph into an executable app
app = workflow.compile()
