from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

@router.websocket("/ws/events")
async def events_socket(websocket: WebSocket):
    try:
        await websocket.accept()
        await websocket.send_json({"type":"hello","service":"netcircuit-api"})
        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.disconnect":
                return
            if message.get("text") is None:
                await websocket.close(code=1003)
                return
            await websocket.send_json({"type":"echo","payload":message["text"]})
    except WebSocketDisconnect:
        return
