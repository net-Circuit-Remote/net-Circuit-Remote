from typing import Any
from pydantic import BaseModel, ConfigDict, Field, field_validator


class CircuitSchemaModel(BaseModel):
    model_config = ConfigDict(strict=True, allow_inf_nan=False)

    @field_validator("*", mode="before")
    @classmethod
    def reject_explicit_null(cls, value: Any) -> Any:
        # Canonical optional fields may be absent, but their declared types exclude null.
        if value is None:
            raise ValueError("field must not be null")
        return value


class CircuitPosition(CircuitSchemaModel):
    model_config = ConfigDict(extra="forbid")
    x: int | float | None = None
    y: int | float | None = None
    z: int | float | None = None


class CircuitModule(CircuitSchemaModel):
    model_config = ConfigDict(extra="allow")
    id: str = Field(min_length=1)
    type: str = Field(min_length=1)
    position: CircuitPosition | None = None
    rotation: int | float | None = None
    properties: dict[str, Any] | None = None

class CircuitConnection(CircuitSchemaModel):
    model_config = ConfigDict(extra="forbid")
    source: str = Field(min_length=3, pattern=r"^[^.]+\.[^.]+$")
    destination: str = Field(min_length=3, pattern=r"^[^.]+\.[^.]+$")
    metadata: dict[str, Any] | None = None

class CircuitGraph(CircuitSchemaModel):
    model_config = ConfigDict(extra="forbid")
    schema_version: str
    circuit_id: str = Field(min_length=1)
    modules: list[CircuitModule]
    connections: list[CircuitConnection]
    metadata: dict[str, Any] | None = None
