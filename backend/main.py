"""
Inspira Backend API - OpenAI-powered version.
Handles file upload (PDF/PPT/Audio/Image) -> text extraction -> embedding storage -> RAG chat.
"""
import os
import shutil
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel

# Load .env before anything else
load_dotenv()

from file_processor.audio_handler import AudioTranscriber
from file_processor.image_handler import ImageDescriber
from file_processor.pdf_handler import extract_text_from_pdf
from file_processor.ppt_handler import extract_text_from_pptx
from file_processor.text_splitter import split_text
from rag_engine.vector_store import InspiraVault
from openai import OpenAI

app = FastAPI(title="Inspira Backend API")


def get_allowed_origins() -> list[str]:
    configured = os.getenv("ALLOWED_ORIGINS") or os.getenv("FRONTEND_URL", "")
    origins = [origin.strip() for origin in configured.split(",") if origin.strip()]
    if not origins:
        origins = [
            "http://localhost:3000",
            "http://localhost:5173",
        ]
    return origins

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Singletons ---
vault = InspiraVault()
image_describer = ImageDescriber()
audio_transcriber = AudioTranscriber()
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --- File type detection ---
AUDIO_EXTENSIONS = {".mp3", ".wav", ".flac", ".ogg", ".m4a", ".webm", ".mp4"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp"}
TEXT_EXTENSIONS = {".txt", ".md"}
TMP_DIR = Path(os.getenv("TMP_DIR", tempfile.gettempdir()))


def build_temp_path(filename: str) -> Path:
    safe_name = os.path.basename(filename) or "upload"
    suffix = Path(safe_name).suffix
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        delete=False,
        dir=TMP_DIR,
        prefix="inspira-",
        suffix=suffix,
    )
    handle.close()
    return Path(handle.name)


class ChatRequest(BaseModel):
    question: str
    stack_id: str
    mode: str = "patterns"   # Added AI mode
    model: str = "gpt-4o-mini" # Added chosen LLM


class ChatResponse(BaseModel):
    answer: str


@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Inspira Backend (OpenAI) is running"}


@app.post("/upload")
@app.post("/api/upload")
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
        temp_path = build_temp_path(filename)

        text_content = ""
        try:
            # Save to disk once, then route to the right processor.
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # --- PDF ---
            if ext == ".pdf":
                text_content = extract_text_from_pdf(str(temp_path))

            # --- PPT ---
            elif ext in (".pptx", ".ppt"):
                text_content = extract_text_from_pptx(str(temp_path), describe_images=False)

            # --- Audio ---
            elif ext in AUDIO_EXTENSIONS:
                text_content = audio_transcriber.transcribe(str(temp_path))

            # --- Image → describe with GPT-4o vision, then store description as text ---
            elif ext in IMAGE_EXTENSIONS:
                with open(temp_path, "rb") as f:
                    image_bytes = f.read()
                text_content = image_describer.describe_image_bytes(
                    image_bytes,
                    filename,
                    prompt="Describe this image in detail. Focus on key visual elements, text content, diagrams, charts, patterns, colors, and any notable characteristics.",
                )

            # --- Plain text ---
            elif ext in TEXT_EXTENSIONS:
                with open(temp_path, "r", encoding="utf-8", errors="ignore") as f:
                    text_content = f.read()

            else:
                raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
        finally:
            if temp_path.exists():
                temp_path.unlink()

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
@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    RAG-powered chat: retrieve relevant context from the stack, then generate answer.
    """
    try:
        # 1. Retrieve relevant chunks from this stack
        context_chunks = vault.search(request.stack_id, request.question, top_k=5)

        # 2. Build prompt based on requested mode
        system_prompt = ""
        if not context_chunks:
            system_prompt = """You are 'Inspira', an AI assistant. The user hasn't uploaded any materials to this stack yet,
or no relevant context was found. Let them know they can upload files (PDF, PPT, images, audio, text)
and then ask questions to find patterns and insights."""
        else:
            context_text = "\n\n".join(f"[Fragment {i+1}]: {chunk}" for i, chunk in enumerate(context_chunks))
            
            # Map frontend mode to specific prompt instructions
            mode_instructions = {
                "patterns": "Identify common themes, recurring patterns, and synthesize a cohesive overview.",
                "summarize": "Provide a concise and structured summary of the core points and key takeaways without fluff.",
                "compare": "Analyze the context to compare different concepts, highlighting similarities and exact differences.",
                "brainstorm": "Use the context as inspiration to generate highly creative, out-of-the-box ideas and novel suggestions.",
                "custom": "Follow the user's specific instructional query exactly as requested, using the context."
            }
            
            instruction = mode_instructions.get(request.mode, mode_instructions["patterns"])
            
            system_prompt = f"""You are 'Inspira', an AI assistant operating in '{request.mode}' mode.
Your goal is to process the user's uploaded materials (documents, images, audio transcripts, notes) to help them.

CRITICAL INSTRUCTION:
{instruction}

Retrieved Context:
{context_text}"""

        # 3. Call OpenAI with the chosen model
        response = openai_client.chat.completions.create(
            model=request.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.question},
            ],
            temperature=0.7,
            max_tokens=1000,
        )

        return {"answer": response.choices[0].message.content}

    except Exception as e:
        print(f"Error in chat: {e}")
        return {"answer": f"Error: {str(e)}"}


handler = Mangum(app, lifespan="off")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
