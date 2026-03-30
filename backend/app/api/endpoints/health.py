from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
	return {"status": "ok", "message": "Inspira Backend (OpenAI) is running"}

