import os
import shutil
from celery import Celery
from backend.settings import settings
from backend.file_processor.pdf_handler import extract_text_from_pdf
from backend.file_processor.ppt_handler import extract_text_from_pptx
from backend.file_processor.audio_handler import AudioTranscriber
from backend.file_processor.image_handler import ImageDescriber
from backend.file_processor.text_splitter import split_text
from backend.rag_engine.vector_store import InspiraVault

# init Celery
celery_app = Celery(
    "inspira_tasks",
    broker=settings.redis_url,
    backend=settings.redis_url
)

vault = InspiraVault()
image_describer = ImageDescriber()
audio_transcriber = AudioTranscriber()

@celery_app.task
def process_file_task(temp_path: str, filename: str, stack_id: str):
    """async file processing task"""
    try:
        ext = os.path.splitext(filename.lower())[1]
        text_content = ""

       
        if ext == ".pdf":
            text_content = extract_text_from_pdf(temp_path)
        elif ext in (".pptx", ".ppt"):
            text_content = extract_text_from_pptx(temp_path, describe_images=False)
        elif ext in (".mp3", ".wav", ".m4a"):
            text_content = audio_transcriber.transcribe(temp_path)
        elif ext in (".jpg", ".png", ".jpeg"):
            with open(temp_path, "rb") as f:
                text_content = image_describer.describe_image_bytes(f.read(), filename)
        elif ext in (".txt", ".md"):
            with open(temp_path, "r", encoding="utf-8") as f:
                text_content = f.read()

        # split and store in ChromaDB
        if text_content.strip():
            chunks = split_text(text_content)
            vault.store_chunks(stack_id, chunks, source=filename)
        
        # remove temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        return {"status": "success", "filename": filename, "chunks": len(chunks)}

    except Exception as e:
        # log error
        return {"status": "error", "message": str(e)}
