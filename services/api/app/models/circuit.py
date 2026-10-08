from typing import Any
from pydantic import BaseModel, ConfigDict, Field

class CircuitModule(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str = Field(min_length=1)
    type: str = Field(min_length=1)

class CircuitConnection(BaseModel):
    model_config = ConfigDict(extra="forbid")
    source: str = Field(min_length=3, pattern=r"^[^.]+\.[^.]+$")
    destination: str = Field(min_length=3, pattern=r"^[^.]+\.[^.]+$")
    metadata: dict[str, Any] | None = None

class CircuitGraph(BaseModel):
    model_config = ConfigDict(extra="forbid")
    schema_version: str
    circuit_id: str = Field(min_length=1)
    modules: list[CircuitModule]
    connections: list[CircuitConnection]
    metadata: dict[str, Any] | None = None
