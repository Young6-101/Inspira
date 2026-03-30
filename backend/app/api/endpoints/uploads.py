import os
import shutil

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from backend.app.core.dependencies import (
	get_audio_transcriber,
	get_image_describer,
	get_vault,
)
from backend.app.api.schemas import UploadResponse
from backend.file_processor.audio_handler import AudioTranscriber
from backend.file_processor.image_handler import ImageDescriber
from backend.file_processor.pdf_handler import extract_text_from_pdf
from backend.file_processor.ppt_handler import extract_text_from_pptx
from backend.file_processor.text_splitter import split_text
from backend.rag_engine.vector_store import InspiraVault

router = APIRouter()

AUDIO_EXTENSIONS = {".mp3", ".wav", ".flac", ".ogg", ".m4a", ".webm", ".mp4"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp"}
TEXT_EXTENSIONS = {".txt", ".md"}


@router.post("/upload", response_model=UploadResponse)
async def upload_file(
	file: UploadFile = File(...),
	stack_id: str = Form(...),
	vault: InspiraVault = Depends(get_vault),
	image_describer: ImageDescriber = Depends(get_image_describer),
	audio_transcriber: AudioTranscriber = Depends(get_audio_transcriber),
):
	try:
		filename = file.filename or "unknown"
		ext = os.path.splitext(filename.lower())[1]
		temp_path = f"temp_{filename}"

		with open(temp_path, "wb") as buffer:
			shutil.copyfileobj(file.file, buffer)

		text_content = ""

		if ext == ".pdf":
			text_content = extract_text_from_pdf(temp_path)
		elif ext in (".pptx", ".ppt"):
			text_content = extract_text_from_pptx(temp_path, describe_images=False)
		elif ext in AUDIO_EXTENSIONS:
			text_content = audio_transcriber.transcribe(temp_path)
		elif ext in IMAGE_EXTENSIONS:
			with open(temp_path, "rb") as image_file:
				image_bytes = image_file.read()
			text_content = image_describer.describe_image_bytes(
				image_bytes,
				filename,
				prompt=(
					"Describe this image in detail. Focus on key visual elements, text content, "
					"diagrams, charts, patterns, colors, and any notable characteristics."
				),
			)
		elif ext in TEXT_EXTENSIONS:
			with open(temp_path, "r", encoding="utf-8", errors="ignore") as text_file:
				text_content = text_file.read()
		else:
			os.remove(temp_path)
			raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

		os.remove(temp_path)

		if not text_content or not text_content.strip():
			return UploadResponse(
				filename=filename,
				message="File uploaded but no content extracted.",
				chunks=0,
			)

		chunks = split_text(text_content)
		vault.store_chunks(stack_id, chunks, source=filename)

		return UploadResponse(
			filename=filename,
			message=f"Processed and stored {len(chunks)} chunks",
			chunks=len(chunks),
			preview=text_content[:300],
		)

	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(status_code=500, detail=f"Upload failed: {str(exc)}")

