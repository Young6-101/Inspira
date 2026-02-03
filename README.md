# Inspira

A RAG-based intelligent assistant with reasoning capabilities.

## Tech Stack

- **Backend**: Python, FastAPI, LangChain, LangGraph, ChromaDB
- **Frontend**: React, TypeScript, Vite, HeroUI, Tailwind CSS

## Project Structure

```
Inspira/
├── backend/           # Python backend service
│   ├── config/        # Configuration files
│   ├── file_processor/# PDF, image, text processing
│   ├── rag_engine/    # RAG components (embedder, retriever, vector store)
│   ├── reasoning/     # LangGraph reasoning nodes
│   └── training/      # Model fine-tuning scripts
├── frontend/          # React frontend application
└── README.md
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- CUDA 12.4 (for GPU acceleration)
- Conda (recommended for environment management)

## Installation

### Backend Setup

1. Create and activate conda environment:

```bash
conda create -n inspira python=3.10
conda activate inspira
```

2. **Install PyTorch with CUDA support** (must install separately due to CUDA dependencies):

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
```

> ⚠️ **Important**: PyTorch must be installed from the PyTorch wheel index to get CUDA support. Installing directly from `requirements.txt` will fail or install CPU-only version.

3. Install other dependencies:

```bash
cd backend
pip install -r requirements.txt
```

4. Create `.env` file in backend directory:

```bash
cp .env.example .env
# Edit .env with your API keys
```

5. Run the backend:

```bash
uvicorn main:app --reload
```

### Frontend Setup

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Run development server:

```bash
npm run dev
```

## Notes

### PyTorch Version Requirements

Due to [CVE-2025-32434](https://nvd.nist.gov/vuln/detail/CVE-2025-32434), PyTorch >= 2.6 is required for `torch.load` functionality. The project currently uses:

- torch==2.6.0+cu124
- torchvision==0.21.0+cu124
- torchaudio==2.6.0+cu124

### For CPU-only Installation

If you don't have a CUDA-capable GPU:

```bash
pip install torch torchvision torchaudio
```

## License

MIT
