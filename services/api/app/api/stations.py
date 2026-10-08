from fastapi import APIRouter
from app.config import settings

router = APIRouter(prefix="/api/stations")

@router.get("")
def list_stations():
    if settings.hardware_mode == "simulation":
        return [{"station_id":"virtual-station-01","mode":"simulation","state":"ready"}]
    return [{"station_id":"physical-station-01","mode":"hardware","state":"unavailable"}]
