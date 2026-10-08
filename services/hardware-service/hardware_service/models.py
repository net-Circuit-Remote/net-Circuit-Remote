from dataclasses import dataclass, field
from typing import Any

@dataclass(frozen=True)
class BreadboardCapability:
    id: str
    model: str = "generic-full-size"

@dataclass(frozen=True)
class StationCapabilities:
    station_id: str
    mode: str
    available: bool
    breadboards: tuple[BreadboardCapability, ...] = field(default_factory=tuple)
    instruments: dict[str, Any] = field(default_factory=dict)
    protocol_versions: dict[str, str] = field(default_factory=lambda: {"hardware_rpc": "0.1-dev"})
