"""
Inspira Backend API (Hybrid CRUD + AI Reasoning)
Handles Stack/File metadata in SQLite + Vector processing in Chroma.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load .env before anything else
load_dotenv()

from backend.database import init_db
from backend.routers import stacks, files
from backend.reasoning.graph import app as reasoning_app
from backend.settings import settings
from backend.main_types import ChatRequest, ChatResponse  # Moved types for cleanliness
from uuid import uuid4

app = FastAPI(title="Inspira Backend API")

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Startup ---
@app.on_event("startup")
def on_startup():
    init_db()
    print("--- [BACKEND] SQLite Database Initialized ---")

# --- Routers ---
app.include_router(stacks.router)
app.include_router(files.router)

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "message": "Inspira Backend is running 🚀",
        "app_mode": settings.app_mode,
        "clip_model": settings.clip_model,
        "memory_enabled": settings.memory_enabled,
    }

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    RAG-powered chat: cross-modal retrieval (text + image via CLIP),
    then generate answer with LLM.
    """
    try:
        session_id = request.session_id or str(uuid4())

        graph_state = {
            "question": request.question,
            "stack_id": request.stack_id,
            "user_id": request.user_id,
            "session_id": session_id,
            "mode": request.mode,
            "model": request.model,
        }
        result = reasoning_app.invoke(graph_state)

        return {"answer": result.get("answer", "")}

    except Exception as e:
        print(f"Error in chat: {e}")
        return {"answer": f"Error: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
