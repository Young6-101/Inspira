"""FastAPI application entrypoint."""
from dotenv import load_dotenv
import os
from fastapi import FastAPI

from backend.app.api.middleware import setup_middleware
from backend.app.api.router import router
from backend.app.core.config import PORT

# Load .env before anything else
load_dotenv()

app = FastAPI(title="Inspira Backend API")

setup_middleware(app)
app.include_router(router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
