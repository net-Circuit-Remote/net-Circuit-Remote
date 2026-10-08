from abc import ABC, abstractmethod
from typing import Any
from hardware_service.models import StationCapabilities

class HardwareUnavailableError(RuntimeError):
    """Raised when a physical hardware action is requested without available hardware."""

class HardwareStation(ABC):
    def __init__(self, station_id: str):
        self.station_id = station_id

    @abstractmethod
    def get_capabilities(self) -> StationCapabilities: ...

    @abstractmethod
    def validate_configuration(self, configuration: dict[str, Any]) -> dict[str, Any]: ...

    @abstractmethod
    def apply_circuit(self, circuit: dict[str, Any]) -> dict[str, Any]: ...

    @abstractmethod
    def set_input(self, input_id: str, value: int) -> dict[str, Any]: ...

    @abstractmethod
    def configure_clock(self, configuration: dict[str, Any]) -> dict[str, Any]: ...

    @abstractmethod
    def configure_generator(self, configuration: dict[str, Any]) -> dict[str, Any]: ...

    @abstractmethod
    def configure_trigger(self, configuration: dict[str, Any]) -> dict[str, Any]: ...

    @abstractmethod
    def arm_capture(self, configuration: dict[str, Any]) -> dict[str, Any]: ...

    @abstractmethod
    def run(self) -> dict[str, Any]: ...

    @abstractmethod
    def stop(self) -> dict[str, Any]: ...

    @abstractmethod
    def read_capture(self) -> dict[str, Any]: ...

    @abstractmethod
    def safe_state(self) -> dict[str, Any]: ...

    @abstractmethod
    def reset(self) -> dict[str, Any]: ...
