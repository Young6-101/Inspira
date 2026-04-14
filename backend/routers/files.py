import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlmodel import Session, select
from typing import List
from uuid import uuid4
from pydantic import BaseModel

from backend.database import get_session
from backend.models import FileRecord, FileResponse, FileUpdate
from backend.tasks import process_file_task
from backend.file_processor.text_splitter import split_text
from backend.rag_engine.vector_store import InspiraVault

router = APIRouter(prefix="/stacks/{stack_id}/files", tags=["files"])
vault = InspiraVault()


class TextNodeCreate(BaseModel):
    text: str
    label: str | None = None


class UrlNodeCreate(BaseModel):
    url: str
    label: str | None = None

@router.post("", response_model=FileResponse)
async def upload_stack_file(
    stack_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    """
    Aligned with frontend: POST /stacks/{stack_id}/files
    """
    try:
        filename = file.filename or "unknown"
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        temp_path = os.path.join(upload_dir, f"{stack_id}_{filename}")

        # Save to disk
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Detect type roughly from extension
        ext = os.path.splitext(filename.lower())[1]
        file_type = "document"
        if ext in (".jpg", ".jpeg", ".png", ".gif", ".webp"):
            file_type = "image"
        elif ext in (".mp3", ".wav", ".m4a"):
            file_type = "audio"
        elif ext in (".pptx", ".ppt"):
            file_type = "presentation"

        # Create record in SQLite
        db_file = FileRecord(
            stack_id=stack_id,
            filename=filename,
            type=file_type,
            status="processing"
        )
        session.add(db_file)
        session.commit()
        session.refresh(db_file)

        # Dispatch background task natively via FastAPI to prevent blocking the event loop
        db_file.task_id = "background-thread"
        session.add(db_file)
        session.commit()
        session.refresh(db_file)
        
        background_tasks.add_task(process_file_task, temp_path, filename, stack_id, db_file.id)

        return db_file
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("", response_model=List[FileResponse])
def list_stack_files(stack_id: str, session: Session = Depends(get_session)):
    files = session.exec(select(FileRecord).where(FileRecord.stack_id == stack_id)).all()
    return files


@router.post("/text", response_model=FileResponse)
def create_text_node(stack_id: str, payload: TextNodeCreate, background_tasks: BackgroundTasks, session: Session = Depends(get_session)):
    text = (payload.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    filename = payload.label or "thought.txt"
    db_file = FileRecord(
        stack_id=stack_id,
        filename=filename,
        type="text",
        label=payload.label,
        text_preview=text[:500],
        status="ready",
    )
    session.add(db_file)
    session.commit()
    session.refresh(db_file)

    chunks = split_text(text)
    if chunks:
        background_tasks.add_task(vault.store_chunks, stack_id, chunks, source=filename)

    return db_file


@router.post("/url", response_model=FileResponse)
def create_url_node(stack_id: str, payload: UrlNodeCreate, background_tasks: BackgroundTasks, session: Session = Depends(get_session)):
    url = (payload.url or "").strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")

    filename = payload.label or "link.url"
    db_file = FileRecord(
        stack_id=stack_id,
        filename=filename,
        type="url",
        label=payload.label,
        text_preview=url[:500],
        status="ready",
    )
    session.add(db_file)
    session.commit()
    session.refresh(db_file)

    session.refresh(db_file)

    background_tasks.add_task(vault.store_chunks, stack_id, [f"URL: {url}"], source=filename)

    return db_file

@router.patch("/{file_id}", response_model=FileResponse)
def update_stack_file(
    stack_id: str, 
    file_id: str, 
    payload: FileUpdate, 
    session: Session = Depends(get_session)
):
    file_rec = session.get(FileRecord, file_id)
    if not file_rec or file_rec.stack_id != stack_id:
        raise HTTPException(status_code=404, detail="File not found in this stack")
    
    if payload.label is not None:
        file_rec.label = payload.label
    
    session.add(file_rec)
    session.commit()
    session.refresh(file_rec)
    return file_rec

@router.delete("/{file_id}")
def delete_stack_file(stack_id: str, file_id: str, session: Session = Depends(get_session)):
    file_rec = session.get(FileRecord, file_id)
    if not file_rec or file_rec.stack_id != stack_id:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Note: We might want to remove it from ChromaDB too, 
    # but for now we focus on the SQLite metadata CRUD.
    session.delete(file_rec)
    session.commit()
    return {"message": "File record deleted"}
