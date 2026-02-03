from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, END
from backend.rag_engine.vector_store import InspiraVault

# 1. Define the state of our graph (What data flows between nodes)
class GraphState(TypedDict):
    question: str      # User input
    context: list[str] # Retrieved fragments from DB
    answer: str        # Final AI response

# 2. Define the Retrieval Node
def retrieve_node(state: GraphState):
    """
    Node to fetch relevant 'Clarity' from the Vault.
    """
    print(f"--- [AGENT] Searching Vault for: {state['question']} ---")
    vault = InspiraVault()
    relevant_chunks = vault.search_clarity(state['question'])
    
    # Update the state with found context
    return {"context": relevant_chunks}

# 3. Build the Graph
workflow = StateGraph(GraphState)

# Add nodes
workflow.add_node("retrieve", retrieve_node)

# Set the flow: Start -> Retrieve -> End
workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", END)

# Compile the graph
app = workflow.compile()