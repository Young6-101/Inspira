# Inspira

Inspira is a multi-modal RAG assistant that helps users analyze uploaded files (PDF, PPT, images, text) and generate insights through a LangGraph reasoning workflow.

Frontend demo: https://inspira.innospace.dev/ (to save token cost, only frontend experience is currently enabled).

## Features

- Multi-modal ingestion (documents + images)
- LangGraph reasoning pipeline (`memory_retrieve -> classify_intent -> tool_router/refine -> generate_response`)
- FastAPI backend with sync and streaming chat endpoints
- React + Vite frontend workspace experience
- Offline RAGAS evaluation pipeline with dataset cleaning utilities

## Tech Stack

- Backend: Python, FastAPI, LangGraph, LangChain, OpenAI API, SQLModel
- Frontend: React, TypeScript, Vite, Tailwind CSS
- Evaluation: RAGAS, HuggingFace `datasets`

## Repository Structure

```
Inspira/
├── backend/
│   ├── main.py                      # FastAPI app entry
│   ├── routers/                     # REST routes (stacks/files/ai)
│   ├── reasoning/                   # LangGraph state, nodes, tools
│   ├── file_processor/              # PDF/PPT/image/text processing
│   ├── rag_engine/                  # Retrieval and embedding logic
│   ├── evaluation/ragas/            # RAGAS scripts and reports
│   └── requirements.txt
├── frontend/
│   ├── src/
│   └── package.json
└── README.md
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- Conda or venv (recommended)
- OpenAI API key

## Backend Setup

1. Create and activate environment

```bash
conda create -n inspira python=3.10 -y
conda activate inspira
```

2. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

3. Create `backend/.env`

Required minimum:

```env
OPENAI_API_KEY=your_key_here
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o-mini
```

Optional commonly used settings:

```env
APP_MODE=local
REDIS_URL=redis://localhost:6379/0
RETRIEVAL_CACHE_ENABLED=true
MEMORY_ENABLED=true
RAGAS_LOG_CHAT_SAMPLES=1
```

4. Run backend (from repository root)

```bash
uvicorn backend.main:app --reload
```

Health check:

```text
GET http://127.0.0.1:8000/health
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Default dev URL is usually `http://127.0.0.1:5173`.

## API Quick Reference

- `POST /chat` — non-streaming chat
- `POST /chat/stream` — SSE streaming chat
- `GET /stacks` / `POST /stacks` — stack management
- `POST /stacks/{stack_id}/files` — file upload

## License

MIT
