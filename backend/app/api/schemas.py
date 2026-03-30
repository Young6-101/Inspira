"""Pydantic request/response schemas for API endpoints."""

from pydantic import BaseModel


class ChatRequest(BaseModel):
    question: str
    stack_id: str
    mode: str = "patterns"
    model: str = "gpt-4o-mini"


class ChatResponse(BaseModel):
    answer: str


class UploadResponse(BaseModel):
    filename: str
    message: str
    chunks: int
    preview: str = ""
