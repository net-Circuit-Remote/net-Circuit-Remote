import sys
from pathlib import Path
import pytest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from hardware_service.station.base import HardwareUnavailableError
from hardware_service.station.physical import PhysicalHardwareStation


def test_physical_station_reports_unavailable_without_driver():
    station=PhysicalHardwareStation('physical-station-01')
    caps=station.get_capabilities()
    assert caps.mode=='hardware'
    assert caps.available is False
    with pytest.raises(HardwareUnavailableError):
        station.run()


def test_physical_station_safe_state_is_callable_without_hardware():
    station=PhysicalHardwareStation('physical-station-01')
    result=station.safe_state()
    assert result['state']=='safe'
    assert result['hardware_applied'] is False

class RecordingDriver:
    def __init__(self):
        self.calls=[]

    def apply_circuit(self, circuit):
        self.calls.append(('apply_circuit', circuit))
        return {'accepted': True, 'source': 'driver'}

    def run(self):
        self.calls.append(('run',))
        return {'state': 'driver-running'}

    def safe_state(self):
        self.calls.append(('safe_state',))
        return {'state': 'driver-safe'}


def test_physical_station_delegates_operations_to_driver():
    driver=RecordingDriver()
    station=PhysicalHardwareStation('physical-station-01', driver=driver)
    graph={'schema_version':'1.0','circuit_id':'c1','modules':[],'connections':[]}
    assert station.apply_circuit(graph)=={'accepted': True, 'source': 'driver'}
    assert station.run()=={'state': 'driver-running'}
    safe=station.safe_state()
    assert safe['state']=='driver-safe'
    assert safe['hardware_applied'] is True
    assert [call[0] for call in driver.calls]==['apply_circuit','run','safe_state']


def test_physical_station_refuses_to_fake_unimplemented_driver_method():
    station=PhysicalHardwareStation('physical-station-01', driver=object())
    with pytest.raises(NotImplementedError):
        station.run()


def test_physical_station_preserves_driver_failure_to_apply_safe_state():
    class UnavailableDriver:
        def safe_state(self):
            return {'state': 'fault', 'hardware_applied': False, 'code': 'DRIVER_UNAVAILABLE'}

    station = PhysicalHardwareStation('physical-station-01', driver=UnavailableDriver())
    assert station.safe_state() == {
        'state': 'fault', 'hardware_applied': False, 'code': 'DRIVER_UNAVAILABLE',
    }
