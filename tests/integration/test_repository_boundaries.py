from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]


def test_major_subsystem_roots_exist():
    required=[
        'apps/web', 'services/api', 'services/hardware-service',
        'simulator/circuit-simulator', 'fpga', 'contracts',
        'device-library', 'deployment', 'docs'
    ]
    missing=[p for p in required if not (ROOT/p).exists()]
    assert not missing, missing


def test_frontend_contains_no_physical_transport_references():
    web=ROOT/'apps/web/src'
    text='\n'.join(p.read_text(errors='ignore').lower() for p in web.rglob('*') if p.is_file())
    forbidden=['/dev/spidev','fpga_register','register_map','mux_address','raw_mux']
    for marker in forbidden:
        assert marker not in text, marker


def test_ci_workflows_exist_for_each_subsystem():
    workflows=ROOT/'.github/workflows'
    required=['frontend.yml','backend.yml','hardware-service.yml','simulator.yml','integration.yml','docs.yml','fpga.yml']
    missing=[name for name in required if not (workflows/name).is_file()]
    assert not missing, missing

def test_frontend_workflow_provisions_pytest_for_python_boundary_check():
    text=(ROOT/'.github/workflows/frontend.yml').read_text()
    assert 'actions/setup-python@v5' in text
    assert 'pip install pytest' in text
