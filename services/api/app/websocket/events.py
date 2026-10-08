from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

@router.websocket("/ws/events")
async def events_socket(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json({"type":"hello","service":"netcircuit-api"})
    try:
        while True:
            message = await websocket.receive_text()
            await websocket.send_json({"type":"echo","payload":message})
    except WebSocketDisconnect:
        return
