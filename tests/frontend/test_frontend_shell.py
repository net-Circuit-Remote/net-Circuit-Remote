from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[2]
WEB=ROOT/'apps/web'

REQUIRED=[
 'package.json','tsconfig.json','vite.config.ts','index.html','src/main.ts','src/App.vue',
 'src/stores/station.ts','src/services/api.ts','src/services/websocket.ts',
 'src/components/LabWorkspace.vue','src/components/HardwareStatus.vue','src/components/LogicAnalyzer.vue',
 'src/types/circuit.ts','src/style.css','README.md'
]
REQUIRED += [
 f'src/stores/{name}.ts' for name in ['circuit', 'workspace', 'experiment', 'instrument', 'ui']
]
REQUIRED += [f'src/services/api/{name}.ts' for name in ['client', 'circuits', 'stations', 'experiments']]
REQUIRED += ['src/router/index.ts', 'src/services/websocket/client.ts', 'src/services/websocket/events.ts']
REQUIRED += [f'src/pages/{name}Page.vue' for name in ['Dashboard', 'Laboratory', 'Circuits', 'Stations', 'Experiments', 'Settings']]

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
    text='\n'.join(path.read_text(encoding='utf-8').lower() for path in (WEB/'src').rglob('*') if path.is_file())
    for forbidden in ['/dev/spidev','fpga_register','register_map','raw_mux','mux_address']:
        assert forbidden not in text


def test_frontend_imports_stay_inside_the_application_boundary():
    source = WEB/'src'
    allowed_packages = {'vue', 'pinia', 'vue-router', 'three'}
    for path in source.rglob('*'):
        if path.suffix not in {'.ts', '.vue'}:
            continue
        text = path.read_text(encoding='utf-8')
        imports = re.findall(r'''(?:from\s*|import\s*\(\s*|import\s*)['"]([^'"]+)['"]''', text)
        for specifier in imports:
            if specifier.startswith('.'):
                assert (path.parent/specifier).resolve().is_relative_to(source.resolve()), (path, specifier)
            else:
                package = '/'.join(specifier.split('/')[:2]) if specifier.startswith('@') else specifier.split('/')[0]
                assert package in allowed_packages, (path, specifier)


def test_fetch_is_centralized_in_api_client():
    callers = []
    for path in (WEB/'src').rglob('*'):
        if path.suffix in {'.ts', '.vue'} and re.search(r'\bfetch\b', path.read_text(encoding='utf-8')):
            callers.append(path.relative_to(WEB).as_posix())
    assert callers == ['src/services/api/client.ts']


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
