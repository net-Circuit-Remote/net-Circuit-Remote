from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
WEB=ROOT/'apps/web'

REQUIRED=[
 'package.json','tsconfig.json','vite.config.ts','index.html','src/main.ts','src/App.vue',
 'src/stores/station.ts','src/services/api.ts','src/services/websocket.ts',
 'src/components/LabWorkspace.vue','src/components/HardwareStatus.vue','src/components/LogicAnalyzer.vue',
 'src/types/circuit.ts','src/style.css','README.md'
]

def test_frontend_shell_files_exist():
    missing=[p for p in REQUIRED if not (WEB/p).is_file()]
    assert not missing, missing


def test_app_declares_project_title_and_hardware_status_supports_simulation():
    app=(WEB/'src/App.vue').read_text()
    status=(WEB/'src/components/HardwareStatus.vue').read_text()
    store=(WEB/'src/stores/station.ts').read_text()
    assert 'net*CIRCUIT Remote' in app
    assert 'Simulation' in status
    assert "mode: 'simulation'" in store


def test_frontend_services_do_not_expose_physical_fpga_controls():
    text='\n'.join((WEB/p).read_text().lower() for p in ['src/services/api.ts','src/services/websocket.ts'])
    for forbidden in ['/dev/spidev','fpga_register','register_map','raw_mux','mux_address']:
        assert forbidden not in text


def test_frontend_typescript_build_config_includes_node_and_modern_libs():
    import json
    package=json.loads((WEB/'package.json').read_text())
    tsconfig=json.loads((WEB/'tsconfig.json').read_text())
    dev=package.get('devDependencies', {})
    options=tsconfig.get('compilerOptions', {})
    libs={item.lower() for item in options.get('lib', [])}
    types={item.lower() for item in options.get('types', [])}
    assert '@types/node' in dev
    assert 'node' in types
    assert 'esnext' in libs or 'esnext.disposable' in libs
