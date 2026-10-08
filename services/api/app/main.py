from fastapi import FastAPI
from app.api.health import router as health_router
from app.api.circuits import router as circuits_router
from app.api.stations import router as stations_router
from app.websocket.events import router as websocket_router

app = FastAPI(title="net*CIRCUIT Remote API", version="0.1.0")
app.include_router(health_router)
app.include_router(circuits_router)
app.include_router(stations_router)
app.include_router(websocket_router)
