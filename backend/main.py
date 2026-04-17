"""
Inspira Backend API (Hybrid CRUD + AI Reasoning)
Handles Stack/File metadata in SQLite + Vector processing in Chroma.
"""
import json
from uuid import uuid4
from contextlib import asynccontextmanager
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
from backend.evaluation.ragas.runtime_logger import append_chat_sample
from backend.settings import settings
from backend.main_types import ChatRequest, ChatResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("--- [BACKEND] SQLite Database Initialized ---")
    yield


app = FastAPI(title="Inspira Backend API", lifespan=lifespan)

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

# --- Routers ---
app.include_router(stacks.router)
app.include_router(files.router)
app.include_router(ai.router)

import os
from fastapi.staticfiles import StaticFiles
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


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
        try:
            append_chat_sample(
                question=request.question,
                answer=result.get("answer", ""),
                contexts=result.get("context", []),
                stack_id=request.stack_id,
                user_id=request.user_id,
                session_id=session_id,
                mode=request.mode,
                model=request.model,
            )
        except Exception as log_err:
            print(f"--- [RAGAS LOG] skipped due to error: {log_err} ---")
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
        answer_parts: list[str] = []
        captured_contexts: list[str] = []

        def _extract_contexts(output: object) -> list[str]:
            if not isinstance(output, dict):
                return []
            raw = output.get("context")
            if isinstance(raw, list):
                return [str(item).strip() for item in raw if str(item).strip()]
            return []

        # astream_events picks up chunks from nodes named 'generate_response' or 'probe_user'
        async for event in reasoning_app.astream_events(graph_state, version="v1"):
            kind = event.get("event")
            if kind == "on_chat_model_stream":
                metadata = event.get("metadata") if isinstance(event, dict) else {}
                node = metadata.get("langgraph_node") if isinstance(metadata, dict) else None
                if node in ["generate_response", "probe_user"]:
                    data = event.get("data") if isinstance(event, dict) else {}
                    chunk = data.get("chunk") if isinstance(data, dict) else None
                    content = getattr(chunk, "content", "")
                    if content:
                        answer_parts.append(content)
                        yield json.dumps({"token": content})
            elif kind == "on_chain_end":
                metadata = event.get("metadata") if isinstance(event, dict) else {}
                node = metadata.get("langgraph_node") if isinstance(metadata, dict) else None
                data = event.get("data") if isinstance(event, dict) else {}
                output = data.get("output") if isinstance(data, dict) else None

                if node in ["tool_router", "refine_context"]:
                    contexts = _extract_contexts(output)
                    if contexts:
                        captured_contexts = contexts
                elif node in ["generate_response", "probe_user"] and isinstance(output, dict):
                    final_answer = output.get("answer")
                    if isinstance(final_answer, str) and final_answer.strip() and not answer_parts:
                        answer_parts.append(final_answer)

        try:
            final_answer_text = "".join(answer_parts).strip()
            if final_answer_text:
                append_chat_sample(
                    question=request.question,
                    answer=final_answer_text,
                    contexts=captured_contexts,
                    stack_id=request.stack_id,
                    user_id=request.user_id,
                    session_id=session_id,
                    mode=request.mode,
                    model=request.model,
                )
        except Exception as log_err:
            print(f"--- [RAGAS LOG] stream skipped due to error: {log_err} ---")

    return EventSourceResponse(event_generator())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
