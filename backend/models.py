"""
SQLModel table definitions for Stacks and Files.
Matches the frontend types in src/types/workspace.ts and src/App.tsx.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field


def _uuid() -> str:
	return uuid.uuid4().hex[:12]


def _now() -> datetime:
	return datetime.now(timezone.utc)


# ═══════════════════════════════════════════════════════════
#  Stack
# ═══════════════════════════════════════════════════════════

class Stack(SQLModel, table=True):
	"""Maps to frontend `Stack { id, name, fileCount, type }`."""
	id: str = Field(default_factory=_uuid, primary_key=True)
	name: str = Field(default="Untitled")
	type: str = Field(default="Unsorted")  # label/category
	created_at: datetime = Field(default_factory=_now)
	updated_at: datetime = Field(default_factory=_now)


class StackCreate(SQLModel):
	name: Optional[str] = "Untitled"
	label: Optional[str] = "Unsorted"  # frontend sends `label`, maps to `type`


class StackUpdate(SQLModel):
	name: Optional[str] = None
	label: Optional[str] = None


class StackResponse(SQLModel):
	id: str
	name: str
	type: str
	fileCount: int = 0
	created_at: datetime
	updated_at: datetime


# ═══════════════════════════════════════════════════════════
#  File (Node in workspace)
# ═══════════════════════════════════════════════════════════

class FileRecord(SQLModel, table=True):
	"""Maps to frontend `WorkspaceNodeData { id, type, label, ... }`."""
	__tablename__ = "file_record"

	id: str = Field(default_factory=_uuid, primary_key=True)
	stack_id: str = Field(index=True)
	filename: str = Field(default="unknown")
	type: str = Field(default="document")  # NodeType: text|image|audio|presentation|document|video|url
	label: Optional[str] = None
	text_preview: Optional[str] = None
	status: str = Field(default="processing")  # processing | ready | error
	task_id: Optional[str] = None  # Celery task ID
	created_at: datetime = Field(default_factory=_now)


class FileResponse(SQLModel):
	id: str
	stack_id: str
	filename: str
	type: str
	label: Optional[str]
	text_preview: Optional[str]
	status: str
	task_id: Optional[str]
	created_at: datetime


class FileUpdate(SQLModel):
	label: Optional[str] = None
