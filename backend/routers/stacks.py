from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from typing import List
from backend.database import get_session
from backend.models import Stack, StackCreate, StackUpdate, StackResponse, FileRecord

router = APIRouter(prefix="/stacks", tags=["stacks"])

@router.post("", response_model=StackResponse)
def create_stack(payload: StackCreate, session: Session = Depends(get_session)):
    stack = Stack(name=payload.name, type=payload.label)
    session.add(stack)
    session.commit()
    session.refresh(stack)
    return StackResponse(
        id=stack.id,
        name=stack.name,
        type=stack.type,
        fileCount=0,
        created_at=stack.created_at,
        updated_at=stack.updated_at
    )

@router.get("", response_model=List[StackResponse])
def list_stacks(session: Session = Depends(get_session)):
    # Get all stacks
    stacks = session.exec(select(Stack)).all()
    results = []
    for stack in stacks:
        # Count files for this stack
        count = session.exec(
            select(func.count(FileRecord.id)).where(FileRecord.stack_id == stack.id)
        ).one()
        results.append(StackResponse(
            id=stack.id,
            name=stack.name,
            type=stack.type,
            fileCount=count,
            created_at=stack.created_at,
            updated_at=stack.updated_at
        ))
    return results

@router.get("/{stack_id}", response_model=StackResponse)
def get_stack(stack_id: str, session: Session = Depends(get_session)):
    stack = session.get(Stack, stack_id)
    if not stack:
        raise HTTPException(status_code=404, detail="Stack not found")
    
    count = session.exec(
        select(func.count(FileRecord.id)).where(FileRecord.stack_id == stack.id)
    ).one()
    
    return StackResponse(
        id=stack.id,
        name=stack.name,
        type=stack.type,
        fileCount=count,
        created_at=stack.created_at,
        updated_at=stack.updated_at
    )

@router.patch("/{stack_id}", response_model=StackResponse)
def update_stack(stack_id: str, payload: StackUpdate, session: Session = Depends(get_session)):
    stack = session.get(Stack, stack_id)
    if not stack:
        raise HTTPException(status_code=404, detail="Stack not found")
    
    if payload.name is not None:
        stack.name = payload.name
    if payload.label is not None:
        stack.type = payload.label
    
    session.add(stack)
    session.commit()
    session.refresh(stack)
    
    count = session.exec(
        select(func.count(FileRecord.id)).where(FileRecord.stack_id == stack.id)
    ).one()
    
    return StackResponse(
        id=stack.id,
        name=stack.name,
        type=stack.type,
        fileCount=count,
        created_at=stack.created_at,
        updated_at=stack.updated_at
    )

@router.delete("/{stack_id}")
def delete_stack(stack_id: str, session: Session = Depends(get_session)):
    stack = session.get(Stack, stack_id)
    if not stack:
        raise HTTPException(status_code=404, detail="Stack not found")
    
    # Also delete associated file records
    file_records = session.exec(select(FileRecord).where(FileRecord.stack_id == stack_id)).all()
    for fr in file_records:
        session.delete(fr)
        
    session.delete(stack)
    session.commit()
    return {"message": "Stack and associated files deleted"}
