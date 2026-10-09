# Web Frontend — Interactive Single Workspace

Vue 3 + TypeScript + Vite + Pinia + Three.js for **net*CIRCUIT Remote**. Phase 1 shell and Phase 2 interactive editor implemented on 2026-10-09. `/` opens the workbench; compatibility URLs redirect there. See [Phase 2 source analysis](../../docs/SOURCE_ANALYSIS_INTERACTIVE_WORKSPACE.md), [DEV_LOG](../../docs/DEV_LOG.md) and [browser evidence](../../docs/verification/2026-10-09-interactive-workspace-browser.md).

## Run and verify

```bash
npm ci
npm run dev
npm test
npm run build
```

From repository root: `python -m pytest -q tests/frontend`. Node 22 is the CI baseline. Vite proxies `/api` and `/ws` to `127.0.0.1:8000`; start FastAPI using `services/api/README.md`. Local graph editing works without backend; structural validation, station discovery and connection state require it. Optional `VITE_API_BASE_URL` / `VITE_WS_URL` configure deployed endpoints.

## Editor controls

| Surface | Behavior |
|---|---|
| New / Open / Save | Independent session drafts; schema 1.0 JSON download/import; shared 2 MB UTF-8 limit. Imports check geometry, unique IDs, module references and local memory images before mutation. |
| Undo / Redo | Last 50 project/graph command snapshots. One move gesture commits one step. Failed/no-op commands preserve history. |
| Ribbon | Twelve families with supplied SVG artwork. Drag a supported component to the surface, or click it then click the surface. Info opens metadata. Unsupported future entries remain previews; instruments open windows. |
| Select | Pick a module or wire. Component inventory and Inspector provide keyboard selection. |
| Move | Drag selected geometry and connected wires as preview; release commits position. Cancel restores graph geometry. |
| Rotate / Delete | Click a module; Rotate adds 90°. Delete cascades connected edges. Delete also removes a picked wire. |
| Wire | Click two named logical ports; pending source is highlighted. Inspector offers Source/Destination selectors and Disconnect. |
| View | Right drag orbit; middle drag pan; wheel dolly. Zoom/reset/snap controls, plus View controls for keyboard orbit/pan. XZ ground plane; Y elevation. Snap step is 0.5 world units. |
| Inspector | Add at origin, select, edit coordinates/rotation/metadata parameters, connect/disconnect, project/session, backend validation, station target, console. |
| Hex Editor | Select generic MEMORY; edit initial bytes, load/save image JSON, Apply and Undo/Redo. Memory v1.0: 8-bit words, 1–256 bytes; new instance explicitly starts with 32 zero bytes. |
| Scope / Probe tools | Select a graph component and open an instrument shell. Acquisition is not connected. |
| Status bar | Actual graph counts, experiment state/mode and five station states. Run/Stop/Step/timing remain unavailable until execution contracts exist. |

Canvas keyboard: R rotates, Delete/Backspace removes selection, arrow keys move by snap step (0.1 with snap off). Escape cancels placement, wiring and move preview even when focus is on ribbon/DOM ports; floating-window Escape still closes the window. Ctrl/Meta+N/O/S/Z, Shift+Z/Y work outside form fields. Floating-window headers support arrow movement and focus restoration.

Projects remain session-local. Save before reload/closing; no server persistence yet. Geometry, overlap, snap and decorative breadboard contacts never create electrical connectivity. API structural validation does not imply electrical approval or execution support.

## Models and contracts

The canonical editor catalog covers 17 types: Breadboard/Board/Power supply visuals; Resistor/Capacitor; Push button/Toggle/DIP/Clock; LED/7-segment/Display/Probe; 74HC08; generic Adder/Multiplier; generic Memory.

Structures and power-supply visual have no electrical ports. 74HC08 ports A1/B1/Y1 through A4/B4/Y4 represent functional gates, not package pin numbers. Generic arithmetic uses explicit 8-bit operands, without unconfirmed part numbers. Memory's local byte contract is separate from SDRAM hardware or capture. Passive/clock defaults are model configuration, not device ratings. Outputs display their housing without fabricated signal readings.

Unknown imported types/properties/port names are retained and exposed via Inspector; unknown geometry uses a fallback model and unknown anchors are not invented. Future Active/Controller/Notation and dual/quad display entries still await metadata/model contracts.

## Ownership and lifecycle

```text
App.vue -> SingleWorkspaceShell
  ComponentRibbon / ToolRail / CircuitWorkspace3D / shared floating windows
  useCircuitEditor -> circuit command/history store
  SceneManager -> ComponentModel + logical wire geometry + picking + OrbitControls
```

Six stores remain separate: circuit (serializable graph/files/history/validation), workspace (tool/selection/pending/snap/zoom), station, experiment, instrument, ui. Scene resources stay outside Pinia. Render requests coalesce into RAF when graph/camera/gesture changes. Zero-sized/hidden/context-lost scenes pause; resize/context restore redraw. Unmount disposes observers/listeners/controls/frames/GPU geometry/material/texture/instance buffers. Floating-window layout/focus still uses Phase 1's shared manager.

## Metadata and supplied icons

Original artwork stays in `assets/icon .svg`. Frontend uses small committed SVG/WebP derivatives with source SHA-256/size provenance in `src/assets/icons/manifest.json`; no original PNG payload is bundled. Action glyphs remain local stroke SVGs. The current set has 20 icons.

```bash
# Python + Pillow, after changing supplied artwork or starter device metadata
python scripts/prepare_workbench_icons.py
# Standard Python, after changing functional editor metadata
python scripts/sync_editor_catalog.py
```

Commit generated files. Normal npm builds need no Python/Pillow. Frontend tests compare canonical metadata snapshots and icon provenance. Artwork alone establishes no electrical pinout.

Typed API/WebSocket layers are retained: requests stay centralized, reconnect refreshes station discovery, and physical-offline selection never silently becomes simulation. Next: Phase 3 simulator/event/clock/model adapters and real output/capture data. Hosted CI runs after push; no hosted run is claimed for local changes. Three.js still produces Vite's existing large-chunk advisory.
