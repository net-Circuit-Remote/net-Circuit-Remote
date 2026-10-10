from typing import Any
from hardware_service.models import BreadboardCapability, StationCapabilities
from hardware_service.station.base import HardwareStation, HardwareUnavailableError

class PhysicalHardwareStation(HardwareStation):
    """Physical adapter boundary.

    The initial scaffold does not implement an FPGA transport driver. When a future driver is
    supplied, operations are delegated to that driver; this adapter must never synthesize a
    successful physical result without invoking the underlying implementation.
    """

    def __init__(self, station_id: str, driver: Any | None = None):
        super().__init__(station_id)
        self._driver = driver

    def _require_driver(self) -> Any:
        if self._driver is None:
            raise HardwareUnavailableError("Physical FPGA driver is not configured.")
        return self._driver

    def _invoke(self, method_name: str, *args: Any) -> dict[str, Any]:
        driver = self._require_driver()
        method = getattr(driver, method_name, None)
        if not callable(method):
            raise NotImplementedError(f"Physical driver does not implement {method_name}().")
        result = method(*args)
        if not isinstance(result, dict):
            raise TypeError(f"Physical driver {method_name}() must return dict, got {type(result).__name__}.")
        return result

    def get_capabilities(self) -> StationCapabilities:
        return StationCapabilities(
            station_id=self.station_id,
            mode="hardware",
            available=self._driver is not None,
            breadboards=(BreadboardCapability("BB0"), BreadboardCapability("BB1")),
            instruments={"status": "hardware-not-integrated"},
        )

    def validate_configuration(self, configuration: dict[str, Any]) -> dict[str, Any]:
        return self._invoke("validate_configuration", configuration)

    def apply_circuit(self, circuit: dict[str, Any]) -> dict[str, Any]:
        return self._invoke("apply_circuit", circuit)

    def set_input(self, input_id: str, value: int) -> dict[str, Any]:
        return self._invoke("set_input", input_id, value)

    def configure_clock(self, configuration: dict[str, Any]) -> dict[str, Any]:
        return self._invoke("configure_clock", configuration)

    def configure_generator(self, configuration: dict[str, Any]) -> dict[str, Any]:
        return self._invoke("configure_generator", configuration)

    def configure_trigger(self, configuration: dict[str, Any]) -> dict[str, Any]:
        return self._invoke("configure_trigger", configuration)

    def arm_capture(self, configuration: dict[str, Any]) -> dict[str, Any]:
        return self._invoke("arm_capture", configuration)

    def run(self) -> dict[str, Any]:
        return self._invoke("run")

    def stop(self) -> dict[str, Any]:
        return self._invoke("stop")

    def read_capture(self) -> dict[str, Any]:
        return self._invoke("read_capture")

    def safe_state(self) -> dict[str, Any]:
        if self._driver is None:
            return {"state": "safe", "hardware_applied": False, "code": "HARDWARE_UNAVAILABLE"}
        result = self._invoke("safe_state")
        return {"hardware_applied": True, **result}

    def reset(self) -> dict[str, Any]:
        return self._invoke("reset")
