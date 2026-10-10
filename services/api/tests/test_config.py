import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.config import Settings


@pytest.mark.parametrize('mode', ['bogus', ''])
def test_settings_reject_mode_outside_api_contract(mode):
    with pytest.raises(ValueError, match='NETCIRCUIT_HARDWARE_MODE'):
        Settings(hardware_mode=mode)
