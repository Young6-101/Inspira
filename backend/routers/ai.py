import json
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sse_starlette.sse import EventSourceResponse
from backend.reasoning.model_client import get_llm
from langchain_core.prompts import ChatPromptTemplate

router = APIRouter(prefix="/ai", tags=["ai"])

class ClusterRequest(BaseModel):
    nodes: List[dict]
    model: str = "gpt-4o-mini"
    stack_id: Optional[str] = None

@router.get("/cluster/health")
async def cluster_health():
    return {"status": "ok", "endpoint": "/ai/cluster"}

@router.post("/cluster")
async def cluster_nodes_streaming(request: ClusterRequest):
    """
    Streaming AI Clustering.
    Yields analysis steps and then the final graph data.
    """
    async def event_generator():
        llm = get_llm(model=request.model, temperature=0.2)
        
        file_map = {}
        if request.stack_id:
            from backend.database import engine
            from sqlmodel import Session, select
            from backend.models import FileRecord
            try:
                with Session(engine) as dbsession:
                    db_files = dbsession.exec(select(FileRecord).where(FileRecord.stack_id == request.stack_id)).all()
                    for f in db_files:
                        if f.text_preview:
                            file_map[f.filename] = f.text_preview
            except Exception as dbe:
                print(f"--- [WARN] Failed to fetch db previews for cluster: {dbe} ---")

        compact_nodes = []
        for node in request.nodes:
            lbl = node.get("label", "")
            txt = (node.get("textPreview") or "")
            if not txt and lbl in file_map:
                txt = file_map[lbl]
                
            compact_nodes.append({
                "id": node.get("id"),
                "label": lbl,
                "textPreview": txt[:500]
            })

        # Step 1: Tell frontend we're starting
        yield json.dumps({"step": "Initializing semantic analysis...", "stage": 1})
        await asyncio.sleep(0.1)

        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a 'Knowledge Graph Designer'. 
Task: Analyze nodes and find shared conceptual elements to connect them.

OUTPUT FORMAT:
{{
  "steps": ["Reasoning step 1", "Reasoning step 2"],
  "clusters": [
    {{ "id": "elem1", "label": "Shared Element/Concept", "nodeIds": ["id1", "id2"], "keywords": ["k1", "k2"] }}
  ],
  "relations": []
}}

Rules:
- Identify SHARED elements (themes, styles, entities) between at least 2 nodes.
- Each cluster represents a 'Shared Element' that links relevant files.
- Return ONLY strict JSON."""),
            ("human", "Nodes:\n{nodes_json}")
        ])

        try:
            yield json.dumps({"step": f"Analyzing {len(compact_nodes)} items for shared patterns...", "stage": 2})
            
            chain = prompt | llm
            # Execute analysis
            response = await llm.ainvoke(prompt.format(nodes_json=json.dumps(compact_nodes)))
            
            content = response.content
            if isinstance(content, str):
                text = content.strip()
            else:
                text = str(content).strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            result = json.loads(text)
            
            # Step 2: Stream reasoning steps found by LLM
            for step in result.get("steps", []):
                yield json.dumps({"step": step, "stage": 2})
                await asyncio.sleep(0.3) # Simulation for UI feel

            # Step 3: Send final graph
            yield json.dumps({
                "stage": 3,
                "clusters": result.get("clusters", []),
                "relations": result.get("relations", [])
            })

        except Exception as e:
            yield json.dumps({"error": str(e)})

    return EventSourceResponse(event_generator())
