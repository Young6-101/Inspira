from fastapi import APIRouter

from backend.app.api.endpoints import chat, health, uploads

router = APIRouter()
router.include_router(health.router, tags=["health"])
router.include_router(uploads.router, tags=["uploads"])
router.include_router(chat.router, tags=["chat"])

