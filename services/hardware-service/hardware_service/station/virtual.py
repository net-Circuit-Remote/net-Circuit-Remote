from typing import Any
from hardware_service.models import BreadboardCapability, StationCapabilities
from hardware_service.station.base import HardwareStation

class VirtualHardwareStation(HardwareStation):
    """Deterministic software station used before FPGA hardware exists."""

    def __init__(self, station_id: str):
        super().__init__(station_id)
        self._state = "safe"
        self._circuit: dict[str, Any] | None = None
        self._inputs: dict[str, int] = {}

    def get_capabilities(self) -> StationCapabilities:
        return StationCapabilities(
            station_id=self.station_id,
            mode="simulation",
            available=True,
            breadboards=(BreadboardCapability("BB0"), BreadboardCapability("BB1")),
            instruments={
                "logic_analyzer": {"available": True, "channels": 4, "status": "starter"},
                "generator": {"available": False, "status": "placeholder"},
                "oscilloscope": {"available": False, "status": "placeholder"},
            },
        )

    def validate_configuration(self, configuration: dict[str, Any]) -> dict[str, Any]:
        return {"valid": isinstance(configuration, dict), "code": "OK" if isinstance(configuration, dict) else "INVALID_CONFIGURATION"}

    def apply_circuit(self, circuit: dict[str, Any]) -> dict[str, Any]:
        self._circuit = circuit
        self._state = "configured"
        return {"accepted": True, "state": self._state}

    def set_input(self, input_id: str, value: int) -> dict[str, Any]:
        if not isinstance(value, int) or value not in (0, 1):
            return {"accepted": False, "code": "INVALID_LOGIC_LEVEL"}
        self._inputs[input_id] = value
        return {"accepted": True, "input_id": input_id, "value": value}

    def configure_clock(self, configuration: dict[str, Any]) -> dict[str, Any]:
        return {"accepted": True, "mode": "virtual", "configuration": configuration}

    def configure_generator(self, configuration: dict[str, Any]) -> dict[str, Any]:
        return {"accepted": False, "code": "NOT_IMPLEMENTED", "feature": "generator"}

    def configure_trigger(self, configuration: dict[str, Any]) -> dict[str, Any]:
        return {"accepted": True, "mode": "virtual", "configuration": configuration}

    def arm_capture(self, configuration: dict[str, Any]) -> dict[str, Any]:
        self._state = "armed"
        return {"accepted": True, "state": self._state, "configuration": configuration}

    def run(self) -> dict[str, Any]:
        self._state = "running"
        return {"state": self._state}

    def stop(self) -> dict[str, Any]:
        self._state = "stopped"
        return {"state": self._state}

    def read_capture(self) -> dict[str, Any]:
        return {"available": True, "samples": [], "format": "virtual-starter"}

    def safe_state(self) -> dict[str, Any]:
        self._state = "safe"
        return {"state": self._state, "hardware_applied": False}

    def reset(self) -> dict[str, Any]:
        self._inputs.clear()
        self._circuit = None
        return self.safe_state()
