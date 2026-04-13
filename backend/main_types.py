from pydantic import BaseModel

class ChatRequest(BaseModel):
    question: str
    stack_id: str
    mode: str = "patterns"
    model: str = "gpt-4o-mini"
    user_id: str = "anon"
    session_id: str = ""

class ChatResponse(BaseModel):
    answer: str
