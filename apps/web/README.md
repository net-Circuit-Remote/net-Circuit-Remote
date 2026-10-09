# Web Frontend — Single Workspace

Vue 3 + TypeScript + Vite + Pinia + Three.js for **net*CIRCUIT Remote**.

Phase 1 Single Workspace shell is implemented on 2026-10-09. `/` opens the workbench directly; legacy and unknown URLs redirect to `/`. No visible page navigation remains. See [source analysis](../../docs/SOURCE_ANALYSIS_SINGLE_WORKSPACE.md), [development evidence](../../docs/DEV_LOG.md) and [browser checks](../../docs/verification/2026-10-09-single-workspace-browser.md).

## Run and verify

```bash
npm ci
npm run dev
npm test
npm run build
```

From repository root: `python -m pytest -q tests/frontend`. Node 22 is the CI baseline. Vite proxies `/api` and `/ws` to the backend at `127.0.0.1:8000`; start FastAPI using `services/api/README.md`. Without the backend, the grid/file tools remain usable and connection errors/reconnect are visible. Optional `VITE_API_BASE_URL` / `VITE_WS_URL` configure deployed endpoints.

## Workbench controls

| Surface | Current behavior |
|---|---|
| New | New independent local draft; previous drafts remain in the session. |
| Open | Import Circuit Graph schema v1 JSON; malformed/oversized files leave the current draft intact. |
| Save | Download graph JSON with project name in metadata. Both import/export use a 2,000,000 UTF-8 byte limit; large files use compact serialization. |
| Undo / Redo | Last 50 project-operation snapshots; New/Open/rename/draft selection. Future graph edit commands must enter this history boundary. |
| Ribbon | Twelve families: Structure, Passive, Active, Output, Input, Logic ICs, Arithmetic ICs, Memory, Display, Embedded/Controller, Instruments, Notation. Component entries open metadata/artwork previews; instrument entries open windows. |
| Tool rail | One active Select/Wire/Move/Rotate/Delete/Scope/Probe state. Scope opens Oscilloscope; Probe opens Signal Monitor. Editing modes are prepared for Phase 2. |
| Workspace | Three.js perspective grid; zoom/reset; independent graph counts. Imported graphs are retained, while 3D component rendering remains pending. |
| Status bar | Run/Stop/Step shells, actual experiment state/mode/counts, five station outcomes and live connection/fault. Execution/timing controls remain unavailable. |
| Inspector | Rename/select session drafts, backend structural validation, station discovery/selection and bounded event console. |

Projects are session-local. Save a JSON file before reload/closing the tab; there is no server persistence yet. API structural validation does not imply electrical approval or execution.

Keyboard: Ctrl/Meta+N/O/S, Ctrl/Meta+Z, Ctrl/Meta+Shift+Z or Ctrl/Meta+Y (except while editing form fields). Ribbon Escape closes the palette. A focused floating-window title supports arrow keys (Shift for larger steps) and Escape. Closing a window restores focus to its opener; ribbon entries return to their stable family button.

## Ownership

```text
App.vue → SingleWorkspaceShell
  AppTitleBar / ComponentRibbon / ToolRail
  CircuitWorkspace3D → three/SceneManager
  SimulationStatusBar
  FloatingWindowManager → shared FloatingWindow
    OscilloscopeWindow / GeneratorWindow / SignalMonitorWindow
    ComponentInfoWindow / InspectorWindow / HexEditorWindow
```

Vue Router only normalizes addresses. The root route's no-op record satisfies Router typing; no RouterView drives lab workflows. All seven legacy page components and five old Library/Workspace/Inspector/Dock/LogicAnalyzer components were removed.

Six stores remain separate: circuit (graph/files/history/validation), workspace (tool/preview/zoom), station (target/status/discovery), experiment (lifecycle), instrument (configuration shells/event console), ui (ribbon/windows/connection). Window management owns open/close/activation/z-order/bounded workspace positions. ResizeObserver reclamps windows after layout changes; window bodies scroll within their bounds.

SceneManager owns scene/camera/grid/renderer outside Pinia. The Vue bridge observes size, handles graphics context recovery and disposes resources/listeners on unmount. Rendering is coalesced on demand. Visual geometry does not define electrical nodes.

## Supplied SVG icons and metadata

The originals in `assets/icon .svg` are SVG wrappers containing PNGs: **101,749,162 bytes** total. The frontend uses generated SVG thumbnails containing WebP images: **43,482 bytes** total, with original SHA-256/size provenance in `src/assets/icons/manifest.json`. Original artwork is preserved. Action/tool glyphs are local stroke SVGs because the supplied files depict components/instruments.

After changing artwork or starter device metadata, regenerate from repository root with Python + Pillow:

```bash
python scripts/prepare_workbench_icons.py
```

Commit generated thumbnails/manifest and `src/data/deviceMetadata.json`; normal npm builds and CI require no Pillow. Frontend boundary tests check provenance and compare device snapshots with canonical `device-library` JSON. Artwork alone never establishes pinout/electrical parameters or simulation support.

## Transport and next phase

Typed `services/api/{client,circuits,stations,experiments}.ts` and `services/websocket/{client,events}.ts` remain unchanged. Requests stay centralized; reconnect refreshes station discovery; physical/offline selection never silently becomes local simulation. No frontend hardware driver imports are permitted.

Phase 2: place/visualize components, picking, graph-backed move/rotate/delete/wire commands and richer metadata. Simulation run/step, waveforms, generator output, supported memory editing and persistence require later API/model integration. Instrument grids show empty states, and generator values are explicitly configuration previews. No measurements or output are fabricated.

Verification commands match the frontend CI workflow; hosted CI is evaluated when these changes are pushed. The production build currently emits Vite's advisory about a large Three.js/application chunk; renderer lazy-loading can be considered separately.
