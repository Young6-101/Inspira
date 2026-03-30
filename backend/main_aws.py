"""
Inspira Backend API - AWS DynamoDB integrated version
Handles file upload to S3 → text extraction → metadata storage → RAG chat
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import io
import uuid
from typing import List, Optional
from datetime import datetime

# Load environment before imports
load_dotenv()

# Set AWS environment for production deployment
if os.getenv('AWS_REGION'):
    os.environ['AWS_REGION'] = os.getenv('AWS_REGION', 'ap-southeast-1')
    os.environ['ENVIRONMENT'] = os.getenv('ENVIRONMENT', 'dev')
    
from database.models import DatabaseManager
from database.config import config

# Conditional imports based on environment
try:
    import boto3
    s3_available = True
except ImportError:
    s3_available = False

app = FastAPI(title="Inspira Backend API (AWS)")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173",
        os.getenv("FRONTEND_URL", "*")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Initialize database manager
db = DatabaseManager()

# S3 client for file uploads
if config.is_aws and s3_available:
    s3_client = boto3.client('s3', region_name=config.aws_region)
    bucket_name = config.s3_bucket_name
else:
    s3_client = None
    bucket_name = None

# File type detection
AUDIO_EXTENSIONS = {".mp3", ".wav", ".flac", ".ogg", ".m4a", ".webm", ".mp4"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp"}
TEXT_EXTENSIONS = {".txt", ".md"}

class ChatRequest(BaseModel):
    question: str
    user_id: str
    mode: str = "patterns"
    model: str = "gpt-4o-mini"

class ChatResponse(BaseModel):
    answer: str
    session_id: str
    reasoning_trace: List[str]

class UploadResponse(BaseModel):
    message: str
    filename: str
    s3_key: Optional[str] = None
    extracted_text: Optional[str] = None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Extract user ID from JWT token (Cognito)
    For now, return a demo user - implement proper JWT validation later
    """
    # TODO: Implement proper Cognito JWT validation
    token = credentials.credentials
    return "demo-user-123"  # Placeholder

def get_file_type(filename: str) -> str:
    """Determine file type from extension"""
    ext = os.path.splitext(filename.lower())[1]
    if ext == ".pdf":
        return "pdf"
    elif ext in [".ppt", ".pptx"]:
        return "presentation"
    elif ext in AUDIO_EXTENSIONS:
        return "audio"
    elif ext in IMAGE_EXTENSIONS:
        return "image"
    elif ext in TEXT_EXTENSIONS:
        return "text"
    else:
        return "unknown"

def extract_text_simple(file_content: bytes, file_type: str, filename: str) -> str:
    """
    Simple text extraction - placeholder implementation
    In production, integrate with your existing text extraction modules
    """
    if file_type == "text":
        return file_content.decode('utf-8', errors='ignore')
    elif file_type == "pdf":
        return f"[PDF Content from {filename}] - Text extraction would go here"
    elif file_type == "image":
        return f"[Image Description from {filename}] - Vision model description would go here"
    elif file_type == "audio":
        return f"[Audio Transcription from {filename}] - Whisper transcription would go here"
    elif file_type == "presentation":
        return f"[Presentation Content from {filename}] - PPT text extraction would go here"
    else:
        return f"[Unknown file type: {file_type}] - {filename}"

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok", 
        "message": "Inspira Backend (AWS) is running",
        "environment": config.environment,
        "is_aws": config.is_aws,
        "tables": config.table_names,
        "s3_bucket": bucket_name
    }

@app.post("/api/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """
    Upload file to S3 and store metadata in DynamoDB
    """
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Determine file type
        file_type = get_file_type(file.filename)
        
        # Upload to S3 (if AWS environment)
        s3_key = None
        if config.is_aws and s3_client and bucket_name:
            s3_key = f"uploads/{user_id}/{uuid.uuid4().hex}_{file.filename}"
            
            s3_client.put_object(
                Bucket=bucket_name,
                Key=s3_key,
                Body=file_content,
                ContentType=file.content_type or 'application/octet-stream'
            )
        
        # Extract text content
        extracted_text = extract_text_simple(file_content, file_type, file.filename)
        
        # Store metadata in DynamoDB
        db.store_file_metadata(
            user_id=user_id,
            filename=file.filename,
            s3_key=s3_key or f"local/{file.filename}",
            content_type=file.content_type or 'application/octet-stream',
            file_size=file_size,
            extracted_text=extracted_text[:5000],  # Limit text size
            embedded=False  # Will be set to True after embedding
        )
        
        return UploadResponse(
            message="File uploaded successfully",
            filename=file.filename,
            s3_key=s3_key,
            extracted_text=extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/api/files")
async def list_user_files(user_id: str = Depends(get_current_user)):
    """List all files for the current user"""
    try:
        files = db.get_user_files(user_id)
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Process chat request with RAG pipeline
    """
    try:
        # Create async task for long-running operations
        task_id = db.create_task(user_id, request.question)
        
        # Placeholder for actual LangGraph reasoning
        reasoning_trace = [
            "🔍 Cross-modal retrieval: Searching user files...",
            "📊 Pattern synthesis: Analyzing aesthetic preferences...",
            "🧠 Insight generation: Creating personalized inspiration...",
            "✅ Validation: Ensuring novel and grounded insights"
        ]
        
        # Placeholder answer
        answer = f"Based on your uploaded materials, I notice patterns in {request.mode} mode. Your unconscious aesthetic preferences show interesting connections... (This is a placeholder - integrate with your LangGraph reasoning engine)"
        
        # Create session record
        session_id = db.create_session(
            user_id=user_id,
            question=request.question,
            answer=answer,
            reasoning_trace=reasoning_trace,
            retrieved_files=[],  # TODO: Populate with actual retrieved files
            pattern_analysis="Placeholder pattern analysis"
        )
        
        # Update task as completed
        db.update_task_result(task_id, answer, "completed")
        
        return ChatResponse(
            answer=answer,
            session_id=session_id,
            reasoning_trace=reasoning_trace
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.get("/api/sessions")
async def get_user_sessions(
    limit: int = 10,
    user_id: str = Depends(get_current_user)
):
    """Get recent chat sessions for the user"""
    try:
        sessions = db.get_user_sessions(user_id, limit)
        return {"sessions": sessions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sessions: {str(e)}")

@app.get("/api/tasks/{task_id}")
async def get_task_status(task_id: str):
    """Get status of async task"""
    try:
        task = db.get_task_status(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get task: {str(e)}")

# For AWS Lambda deployment
if config.is_aws:
    try:
        from mangum import Mangum
        handler = Mangum(app, lifespan="off")
    except ImportError:
        # Mangum not installed - running locally
        pass

if __name__ == "__main__":
    import uvicorn
    print(f"Starting Inspira Backend in {'AWS' if config.is_aws else 'local'} mode")
    print(f"Tables: {config.table_names}")
    if bucket_name:
        print(f"S3 Bucket: {bucket_name}")
    uvicorn.run(app, host="0.0.0.0", port=8000)