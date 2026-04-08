"""
Inspira Backend API - OpenAI-powered version.
Handles file upload (PDF/PPT/Audio/Image) → text extraction → embedding storage → RAG chat.
"""
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import shutil
import os
from typing import List
from uuid import uuid4

# Load .env before anything else
load_dotenv()

from backend.file_processor.pdf_handler import extract_text_from_pdf
from backend.file_processor.ppt_handler import extract_text_from_pptx
from backend.file_processor.audio_handler import AudioTranscriber
from backend.file_processor.image_handler import ImageDescriber
from backend.file_processor.text_splitter import split_text
from backend.rag_engine.vector_store import InspiraVault
from backend.reasoning.graph import app as reasoning_app
from backend.settings import settings

app = FastAPI(title="Inspira Backend API")

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Singletons ---
vault = InspiraVault()
image_describer = ImageDescriber()
audio_transcriber = AudioTranscriber()

# --- File type detection ---
AUDIO_EXTENSIONS = {".mp3", ".wav", ".flac", ".ogg", ".m4a", ".webm", ".mp4"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp"}
TEXT_EXTENSIONS = {".txt", ".md"}


class ChatRequest(BaseModel):
    question: str
    stack_id: str
    mode: str = "patterns"   # Added AI mode
    model: str = "gpt-4o-mini" # Added chosen LLM
    user_id: str = "anon"
    session_id: str = ""


class ChatResponse(BaseModel):
    answer: str


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "message": "Inspira Backend is running 🚀",
        "app_mode": settings.app_mode,
        "embedding_provider": settings.embedding_provider,
        "memory_enabled": settings.memory_enabled,
    }


@app.get("/metrics/cache")
async def cache_metrics():
    return vault.get_cache_metrics()


@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    stack_id: str = Form(...),
):
    """
    Upload a file to a stack.
    1. Save temp file
    2. Extract text (based on file type)
    3. Split into chunks
    4. Embed and store in ChromaDB under the stack's collection
    """
    try:
        filename = file.filename or "unknown"
        ext = os.path.splitext(filename.lower())[1]
        temp_path = f"temp_{filename}"

        # Save to disk
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        text_content = ""

        # --- PDF ---
        if ext == ".pdf":
            text_content = extract_text_from_pdf(temp_path)

        # --- PPT ---
        elif ext in (".pptx", ".ppt"):
            text_content = extract_text_from_pptx(temp_path, describe_images=False)

        # --- Audio ---
        elif ext in AUDIO_EXTENSIONS:
            text_content = audio_transcriber.transcribe(temp_path)

        # --- Image → describe with GPT-4o vision, then store description as text ---
        elif ext in IMAGE_EXTENSIONS:
            with open(temp_path, "rb") as f:
                image_bytes = f.read()
            text_content = image_describer.describe_image_bytes(
                image_bytes, filename,
                prompt="Describe this image in detail. Focus on key visual elements, text content, diagrams, charts, patterns, colors, and any notable characteristics."
            )

        # --- Plain text ---
        elif ext in TEXT_EXTENSIONS:
            with open(temp_path, "r", encoding="utf-8", errors="ignore") as f:
                text_content = f.read()

        else:
            os.remove(temp_path)
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

        # Cleanup temp file
        os.remove(temp_path)

        if not text_content or not text_content.strip():
            return {"filename": filename, "message": "File uploaded but no content extracted.", "chunks": 0}

        # Split into chunks and store
        chunks = split_text(text_content)
        vault.store_chunks(stack_id, chunks, source=filename)

        return {
            "filename": filename,
            "message": f"Processed and stored {len(chunks)} chunks",
            "chunks": len(chunks),
            "preview": text_content[:300],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    RAG-powered chat: retrieve relevant context from the stack, then generate answer.
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
