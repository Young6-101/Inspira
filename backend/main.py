"""
Inspira Backend API (Hybrid CRUD + AI Reasoning)
Handles Stack/File metadata in SQLite + Vector processing in Chroma.
"""
import json
from uuid import uuid4
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from dotenv import load_dotenv
from sse_starlette.sse import EventSourceResponse

# Load .env before anything else
load_dotenv()

from backend.database import init_db
from backend.routers import stacks, files, ai
from backend.reasoning.graph import app as reasoning_app
from backend.settings import settings
from backend.main_types import ChatRequest, ChatResponse

app = FastAPI(title="Inspira Backend API")

# --- CORS ---
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
app.include_router(ai.router)


@app.get("/debug/langgraph/mermaid", response_class=PlainTextResponse)
def debug_langgraph_mermaid():
    """Return current LangGraph topology as Mermaid text for visualization."""
    try:
        graph = reasoning_app.get_graph()
        if hasattr(graph, "draw_mermaid"):
            return graph.draw_mermaid()
        return str(graph)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to render graph: {str(e)}")

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
    """Sync version of chat."""
    try:
        session_id = request.session_id or str(uuid4())
        graph_state = {
            "question": request.question, "stack_id": request.stack_id,
            "user_id": request.user_id, "session_id": session_id,
            "mode": request.mode, "model": request.model,
        }
        result = reasoning_app.invoke(graph_state)
        return {"answer": result.get("answer", "")}
    except Exception as e:
        return {"answer": f"Error: {str(e)}"}

@app.post("/chat/stream")
async def chat_stream_endpoint(request: ChatRequest):
    """Streaming version of chat via SSE."""
    session_id = request.session_id or str(uuid4())
    
    async def event_generator():
        graph_state = {
            "question": request.question, "stack_id": request.stack_id,
            "user_id": request.user_id, "session_id": session_id,
            "mode": request.mode, "model": request.model,
        }
        # astream_events picks up chunks from nodes named 'generate_response' or 'probe_user'
        async for event in reasoning_app.astream_events(graph_state, version="v1"):
            kind = event["event"]
            if kind == "on_chat_model_stream":
                node = event["metadata"].get("langgraph_node")
                if node in ["generate_response", "probe_user"]:
                    content = event["data"]["chunk"].content
                    if content:
                        yield json.dumps({"token": content})

    return EventSourceResponse(event_generator())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
