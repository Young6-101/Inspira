from fastapi import APIRouter

from .endpoints import chat, health, uploads

router = APIRouter()
router.include_router(health.router, tags=["health"])
router.include_router(uploads.router, tags=["uploads"])
router.include_router(chat.router, tags=["chat"])

