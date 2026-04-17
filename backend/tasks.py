"""
Celery background tasks for file processing.
Now integrated with SQLite to update file status.
"""
import os
from celery import Celery
from sqlmodel import Session
from backend.database import engine
from backend.models import FileRecord
from backend.settings import settings
from backend.file_processor.pdf_handler import extract_from_pdf
from backend.file_processor.ppt_handler import extract_from_pptx
from backend.file_processor.audio_handler import AudioTranscriber
from backend.file_processor.image_handler import ImageDescriber
from backend.file_processor.text_splitter import split_text
from backend.rag_engine.vector_store import InspiraVault

# init Celery
celery_app = Celery(
	"inspira_tasks",
	broker=settings.redis_url,
	backend=settings.redis_url,
)

# For the presentation, run everything synchronously (No Redis or Celery Worker needed!)
celery_app.conf.update(task_always_eager=True, task_eager_propagates=True)

vault = InspiraVault()
image_describer = ImageDescriber()
audio_transcriber = AudioTranscriber()

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}


def _store_extracted_images(stack_id: str, images: list[dict], source_file: str):
	"""Store extracted images (from PDF/PPT) into image_collection via CLIP."""
	count = 0
	for img in images:
		try:
			vault.store_image_bytes(
				stack_id,
				img["bytes"],
				source=f"{source_file}/{img['name']}",
			)
			count += 1
		except Exception as e:
			print(f"--- [WARN] Skipping image embedding for {img['name']}: {e} ---")
	if count > 0:
		print(f"--- [TASK] Stored {count} embedded images from {source_file} → image_collection ---")


@celery_app.task
def process_file_task(temp_path: str, filename: str, stack_id: str, db_file_id: str = None):
	"""Async file processing task with SQLite status tracking."""
	try:
		ext = os.path.splitext(filename.lower())[1]
		text_content = ""
		chunks_stored = 0

		# ── PDF: text + embedded images ──
		if ext == ".pdf":
			result = extract_from_pdf(temp_path)
			text_content = result.text
			_store_extracted_images(stack_id, result.images, filename)

		# ── PPT: text + embedded images ──
		elif ext in (".pptx", ".ppt"):
			result = extract_from_pptx(temp_path)
			text_content = result.text
			_store_extracted_images(stack_id, result.images, filename)

		# ── Audio: Whisper → text ──
		elif ext in (".mp3", ".wav", ".m4a", ".flac", ".ogg", ".webm", ".mp4"):
			text_content = audio_transcriber.transcribe(temp_path)

		# ── Standalone Image: dual storage ──
		elif ext in IMAGE_EXTENSIONS:
			with open(temp_path, "rb") as f:
				image_bytes = f.read()
			# 1. CLIP image embedding → image_collection
			try:
				vault.store_image_bytes(stack_id, image_bytes, source=filename, save_path=temp_path)
			except Exception as e:
				print(f"--- [WARN] Skipping raw image embedding: {e} ---")
			# 2. Vision description → text → text_collection
			text_content = image_describer.describe_image_bytes(image_bytes, filename)

		# ── Plain text ──
		elif ext in (".txt", ".md"):
			with open(temp_path, "r", encoding="utf-8") as f:
				text_content = f.read()

		# Store text content as chunks → CLIP text encoder → text_collection
		if text_content.strip():
			chunks = split_text(text_content)
			vault.store_chunks(stack_id, chunks, source=filename)
			chunks_stored = len(chunks)

		# Update status in SQLite
		if db_file_id:
			with Session(engine) as session:
				file_rec = session.get(FileRecord, db_file_id)
				if file_rec:
					file_rec.status = "ready"
					file_rec.text_preview = text_content[:500] if text_content else ""
					session.add(file_rec)
					session.commit()

		# Remove temp file (except standalone images we want the frontend grid to permanently display)
		if os.path.exists(temp_path) and ext not in IMAGE_EXTENSIONS:
			os.remove(temp_path)

		return {"status": "success", "filename": filename, "chunks": chunks_stored, "db_id": db_file_id}

	except Exception as e:
		print(f"--- [ERROR] process_file_task failed: {e} ---")
		if db_file_id:
			with Session(engine) as session:
				file_rec = session.get(FileRecord, db_file_id)
				if file_rec:
					file_rec.status = "error"
					file_rec.text_preview = f"[PROCESSING ERROR] {str(e)[:450]}"
					session.add(file_rec)
					session.commit()
		return {"status": "error", "message": str(e)}
