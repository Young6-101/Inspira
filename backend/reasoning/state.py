from typing import NotRequired, TypedDict

class GraphState(TypedDict):
    """
    Represents the state of the reasoning graph.
    
    Attributes:
        question: The user's input question
        context: Retrieved fragments from the vector store
        answer: The final generated answer from the LLM
    """
    question: str
    stack_id: str
    user_id: str
    session_id: str
    mode: str
    model: str

    context: NotRequired[list[str]]
    stm_text: NotRequired[str]
    mtm_text: NotRequired[str]
    answer: NotRequired[str]
