from typing import Any
from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse
from app.services.circuit_validator import validate_circuit_graph

router = APIRouter(prefix="/api/circuits")

@router.post("/validate")
def validate_circuit(payload: Any = Body(default=None)):
    valid, code, message = validate_circuit_graph(payload)
    body = {"valid": valid, "code": code, "message": message}
    if not valid:
        return JSONResponse(status_code=422, content=body)
    return body
