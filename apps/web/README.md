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
| Ribbon | Twelve families with supplied SVG artwork. Drag a supported component to the surface, or click it then click the surface. Info is enabled for the selected placed component's type. Unsupported future entries report model unavailable; instruments open windows. |
| Select | Click a module/wire to select it; dragging a model does not move it or the camera. Left drag empty surface to pan. Component inventory and Inspector provide keyboard selection. |
| Move | The only tool that permits direct model dragging, including Breadboard/Board: preview geometry and connected wires; release commits one position command. Cancel restores graph geometry. Click/jitter below 4 px creates no move/history. |
| Rotate / Delete | Click a module; Rotate adds 90°. Delete cascades connected edges. Delete also removes a picked wire. |
| Wire | Click two named logical ports; pending source is highlighted. Inspector offers Source/Destination selectors and Disconnect. |
| View | Left drag empty surface to grab/pan the XZ plane in any direction; right drag orbit; middle drag also pans; wheel dolly. Camera-oriented XYZ gizmo with six nearby orbit/pan buttons replaces View controls. Pan buttons follow the camera's ground-plane heading. Zoom/reset/snap remain; snap step is 0.5 world units. |
| Component Info | Opens at the upper right only for an existing selected model, with contained artwork, name, introduction and Add +. Clearing selection, starting placement or removing that model hides the panel. Add arms the same supported type; click the surface to commit placement. Future/imported unknown models cannot be added. The panel has no edit/delete/pinout actions. Closing returns focus to the canvas. |
| Inspector | Add at origin, select, edit coordinates/rotation/metadata parameters, connect/disconnect, project/session, backend validation, station target, console. |
| Hex Editor | Select generic MEMORY; edit initial bytes, load/save image JSON, Apply and Undo/Redo. Memory v1.0: 8-bit words, 1–256 bytes; new instance explicitly starts with 32 zero bytes. |
| Scope / Probe tools | Select a graph component and open an instrument shell. Acquisition is not connected. |
| Status bar | Actual graph counts, experiment state/mode and five station states. Run/Stop/Step/timing remain unavailable until execution contracts exist. |

Canvas keyboard: R rotates, Delete/Backspace removes selection, arrow keys move by snap step (0.1 with snap off). Escape cancels placement, wiring and move preview even when focus is on ribbon/DOM ports; floating-window Escape still closes the window. Ctrl/Meta+N/O/S/Z, Shift+Z/Y work outside form fields. Instrument/Inspector/Hex Editor headers support arrow movement and focus restoration; Component Info is anchored at the upper right.

Projects remain session-local. Save before reload/closing; no server persistence yet. Geometry, overlap, snap and decorative breadboard contacts never create electrical connectivity. API structural validation does not imply electrical approval or execution support.

Navigation correction: see [algorithm/source analysis](../../docs/SOURCE_ANALYSIS_WORKSPACE_NAVIGATION.md) and [current Move-only browser evidence](../../docs/verification/2026-10-09-move-tool-browser.md). With Move selected, model dragging uses a horizontal plane through the picked surface, so a visible model remains draggable near a low camera. Its stored Y elevation, rotation and named connections stay intact. Pan changes camera/target only, retains selection/pending wire while dragging and records no circuit history; a blank click clears selection. During left gestures, other camera input is locked until release/cancel. Escape, tool/graph changes, hidden tabs and context loss cancel model previews.

## Models and contracts

The canonical editor catalog covers 19 types: Breadboard 830/630/100, Board/Power supply visuals; Resistor/Capacitor; Push button/Toggle/DIP/Clock; LED/7-segment/Display/Probe; 74HC08; generic Adder/Multiplier; generic Memory.

Breadboard housing has a beveled footprint, recessed terminal/rail channels and real socket cavities with tapered entrances, walls and dark floors. Deck/decal perforations share coordinates with the 830/630/100 instances. Common mating keys have clearance; bevels stay within catalog docking bounds. Selection uses a **2 CSS px Medium Gold (#d4af37)** contour without tinting the body; curved silhouettes update with the camera. The adaptive technical grid has dark minor lines, major lines every five cells, distance fade and zoom-based minor suppression. Canvas caption is removed. Details: [current source analysis](../../docs/SOURCE_ANALYSIS_TECHNICAL_WORKBENCH.md), [browser report](../../docs/verification/2026-10-09-technical-workbench-browser.md). Earlier selection reports are historical.

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
