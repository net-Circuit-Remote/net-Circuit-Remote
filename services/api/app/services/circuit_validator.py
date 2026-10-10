from pydantic import ValidationError
from typing import Any
from app.models.circuit import CircuitGraph


def validate_circuit_graph(payload: Any) -> tuple[bool, str, str]:
    try:
        graph = CircuitGraph.model_validate(payload)
    except ValidationError as exc:
        first = exc.errors()[0]
        location = ".".join(str(part) for part in first.get("loc", ()))
        return False, "SCHEMA_VALIDATION_ERROR", f"{location}: {first.get('msg', 'invalid value')}"
    if graph.schema_version != "1.0":
        return False, "UNSUPPORTED_SCHEMA_VERSION", f"Unsupported Circuit Graph schema: {graph.schema_version}"
    return True, "OK", "Circuit Graph is structurally valid."
