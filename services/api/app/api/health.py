from fastapi import APIRouter
from app.config import settings

router = APIRouter(prefix="/api")

@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "netcircuit-api", "hardware_mode": settings.hardware_mode}
