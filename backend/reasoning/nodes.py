from rag_engine.retriever import InspiraRetriever
from reasoning.model_client import get_llm
from reasoning.state import GraphState
from langchain_core.prompts import ChatPromptTemplate

def retrieve_node(state: GraphState):
    """
    Node to retrieve relevant fragments from the vector store.
    Delegates to InspiraRetriever for text + image retrieval.
    """
    print("--- [AGENT] Retrieving Relevant Fragments ---")
    retriever = InspiraRetriever()
    context = retriever.retrieve(state['question'])
    return {"context": context}

def generate_node(state: GraphState):
    """
    Node to synthesize inspiration from retrieved fragments.
    
    This node:
    1. Takes the retrieved context
    2. Uses an LLM to generate a creative career inspiration
    3. Returns the generated answer
    
    Args:
        state: Current graph state containing question and context
        
    Returns:
        dict: Updated state with answer field populated
    """
    print("--- [AGENT] Synthesizing Inspiration with LLM ---")
    
    # Get the LLM client
    llm = get_llm()
    
    # Create a prompt that injects the context
    prompt = ChatPromptTemplate.from_template("""
    You are 'Inspira', an AI assistant that finds patterns and generates insights
    from the user's uploaded materials (documents, images, notes, etc.).

    Based on the retrieved context below, answer the user's question.
    Identify common themes, recurring patterns, and provide actionable recommendations.
    Tailor your response to the type of content and the user's question.

    Retrieved Context:
    {context}

    User's Question: {question}

    Insights & Recommendations:
    """)
    
    # Chain: Prompt -> LLM
    chain = prompt | llm
    response = chain.invoke({"context": state['context'], "question": state['question']})
    
    return {"answer": response.content}
