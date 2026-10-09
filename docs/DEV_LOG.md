---
project: net-Circuit-Remote
current_phase: interactive-circuit-workspace-navigation-complete
status: verified
last_updated: 2026-10-09
next_task: phase-3-simulator-event-clock-model-integration
blocking_issue: none
hardware_mode: simulation
fpga_development_started: false
---

# Development Log

## Current Goal

Phase 2 **Interactive Circuit Workspace** is implemented, preserving Phase 1 shell and transport boundaries. Next: Phase 3 simulator/event/clock/model adapters and real output/capture data.

## Breadboard Magnetic Docking & Anti-Overlap Snapping — 2026-10-09

Resolved physical gap and overlapping issues when joining multiple breadboards (`BREADBOARD`, `BREADBOARD_630`, `BREADBOARD_100`). Implemented `snapPosition` in `useCircuitEditor.ts` featuring:
1. **Mathematical Edge-to-Edge Magnetic Docking**: Calculates exact physical docking offsets along Z (North/South: $(D_1 + D_2) / 2$) and X (West/East: $(W_1 + W_2) / 2$) with magnetic capture zones ($dZ \le 0.65, dX \le 1.5$ for Z-joints, $dX \le 0.65, dZ \le 1.2$ for X-joints). Automatically filters out already-occupied docking slots.
2. **Anti-Overlap Collision Resolution**: 3-pass AABB collision relaxation actively repels overlapping breadboards to the nearest flush boundary, preventing models from penetrating or superimposing on each other.
3. **Component Non-Interference**: Standard grid snapping remains intact for electrical components (resistors, ICs, LEDs, etc.) to allow natural placement onto breadboard surfaces.
4. **Verification**: 56/56 web unit tests passed, including dedicated test cases for BB630-to-BB630 ($Z=1.86$), BB100-to-BB630 ($Z=1.19$), BB100-to-BB100 ($Z=0.52$), side-by-side ($X=9.0$), penetration repulsion, and component transparency. Production build passed in 3.19s.

## Breadboard 630 and Power Breadboard 100 3D Models — 2026-10-09

Implemented photorealistic 3D models and high-resolution procedural textures (Anisotropy 16) for `BREADBOARD_630` (630-tie-point terminal strip: 63 cols x 10 rows A..E & F..J, center IC divider groove, dovetail joints, no power rails) and `BREADBOARD_100` (100-tie-point power bus strip: 50 cols x 2 rows in 5-hole clusters, continuous red (+) and blue (-) power lines, bold polarity indicators, modular dovetail interlocking tabs/notches). Both visual structures are registered in canonical `device-library/editor/components.json` and synchronized 1:1 with `apps/web/src/data/editorCatalog.json`. Each model utilizes exactly 1 GPU `InstancedMesh` with automated buffer disposal upon removal. Verified with pytest (11/11 PASS), npm test (55/55 PASS), and production build (PASS).

## Move-only model dragging — 2026-10-09

Latest user rule: direct mouse dragging of breadboard and every other model requires the Move button. `useCircuitEditor` now creates a model gesture only for `workspace.tool === 'move'`; Select still picks/highlights without capture or preview. Empty-surface pan, right orbit, camera-oriented XYZ and nearby navigation buttons remain. Workspace help/hints and grab cursor match the active tool. Inspector coordinate edits and keyboard movement retain their existing behavior.

TDD evidence: the new Select regression failed before the guard change because a breadboard preview moved to X=1.5/Z=1. After correction, **npm 54/54 PASS**, including Select breadboard/LED geometry/camera/history invariants, Move preview/commit/Undo/Redo, low-angle dragging and Move-to-Select cancellation. **Production build PASS** (113 modules; existing Vite chunk advisory). Native browser: the same breadboard drag leaves X=1.5/Y=0/Z=1.5 in Select, moves to X=3/Y=0/Z=2.5 in Move, and one Undo restores the original pose; three components/one named wire remain. Browser warning/error logs are empty. See `verification/2026-10-09-move-tool-browser.md` and screenshot.

Current README/architecture/context/roadmap/spec/analysis/changelog/manifest reflect Move-only. Earlier navigation results below are historical and describe the superseded Select drag behavior.

## Historical workspace navigation correction — 2026-10-09

User requested direct left-drag pan/model movement and camera-oriented XYZ with adjacent navigation controls. Root causes: OrbitControls LEFT disabled without editor pan handler, model gesture gated on Move tool, and static SVG independent of camera. Source/algorithm analysis across frontend graph/render/transport and backend/simulator/hardware boundaries is in `SOURCE_ANALYSIS_WORKSPACE_NAVIGATION.md`.

Default Select and Move now left-drag any model, including Breadboard/Board; empty-surface left-drag grabs/pans the XZ plane. A 4 px threshold distinguishes click/jitter from drag. Model previews preserve elevation/rotation/endpoints and commit one history command on release. Pan translates camera/target only, retains selection/pending wire and records no graph history. Capture identity/release/cancel and camera input lock respect hidden/context loss. Wire/Rotate/Delete/instrument click meanings remain intact.

`WorkspaceNavigator` replaces View controls and the static axis. It projects fixed world bases through inverse camera quaternion, sorts depth and updates in the existing render callback. Six accessible local SVG buttons sit beside XYZ; pan buttons follow camera XZ heading. Passive gizmo regions pass events to the canvas.

Fresh read-only review found one Important low-camera case and one Minor overlay issue. A visible model could be picked while its ray missed Y=0; moves now intersect a horizontal plane through the actual hit, preserving module Y. A regression was RED with the old ground gate and GREEN after correction. Navigator root ignores pointer events; actual buttons receive them, with browser hit-test confirmation.

Verification: **npm 53/53 PASS**, **production build PASS** (113 modules); **full Python 56/56 PASS** with three existing dependency deprecations; `check_context.py` and `git diff --check` PASS. Existing Vite chunk-size advisory remains. Native browser verified Select breadboard/switch dragging, diagonal pan before/after orbit, connected wires, single Undo/Redo, XYZ update, six buttons and four desktop sizes (1920×1080, 1440×900, 1366×768, 1280×720), with no overflow/hint overlap and no warning/error logs. Right-button rotation is verified with genuine OrbitControls pointer-sequence/render integration; CUA native right-drag is unavailable and is not claimed. Exact evidence: `verification/2026-10-09-workspace-navigation-browser.md` and screenshot.

Updated current README/architecture/context/roadmap/spec/analysis/changelog/manifest; historical browser reports retained. No dependency/contract/driver changes, commit/push/deployment or hosted CI run. Phase 3 remains next.

## Phase 2 source and behavior — 2026-10-09

Deep source analysis: `SOURCE_ANALYSIS_INTERACTIVE_WORKSPACE.md`. Added canonical functional catalog and verified browser snapshot for 17 placeable types. 74HC08 uses logical gate port metadata; generic Adder/Multiplier have no part number. Breadboard/Board/Power supply visuals have no ports. Local memory image v1.0 is a separate 8-bit byte contract (1–256 bytes, explicit 32-zero-byte initialization), not physical RAM/capture.

SceneManager now owns lights/models/labels/port anchors/wire projection/picking and OrbitControls. Visual world XZ placement/Y elevation and yaw rotation stay separate from endpoints. Requests coalesce via RAF, pause for zero size/hidden/context loss, and dispose all frame/listener/control/GPU resources on unmount. Ghosts are reused while moving and release instance buffers when canceled.

Ribbon supports native drag/drop and click-to-place. Commands implement select/move/rotate/delete/wire/unwire/snap/undo/redo. Move previews geometry then records one history step on release; cancellation restores graph geometry. Delete cascades incident edges; Undo restores both. Failed/no-op edits do not change history or validation. Connections use explicit named ports and reject duplicate edges, wrong direction/width and additional input drivers, while allowing fanout. Unknown imported metadata is retained; guards reject duplicate IDs, dangling module references, malformed geometry/memory before mutation.

Inspector supports selected-module coordinates/rotation/metadata configuration, keyboard placement/selection/connect/disconnect, existing project/station/validation/console. Hex Editor Apply/Load/Save and Undo/Redo operate on local graph images; asynchronous load verifies draft/selection again before mutation. Run/Stop/Step and instrument acquisition/output remain unavailable until execution contracts exist.

## Phase 2 verification and review

- Baseline: npm 31/31 outside sandbox. New graph/catalog/memory/scene interfaces were RED before implementation, then GREEN.
- Final-review regressions: InstancedMesh disposal and ghost identity reproduced RED; corrected. Palette/DOM-port Escape reproduced RED in browser; shared capture handler corrected both focus paths while preserving floating-window closure.
- Final frontend suite: **43/43 PASS**; production build **PASS**. Full Python regression: **56/56 PASS**, including canonical editor provenance and memory schema; three existing dependency warnings. `check_context.py` PASS. Exact final evidence: `verification/2026-10-09-interactive-workspace-browser.md`.
- Browser verified native breadboard drag/drop, switch/LED placement and wiring, Move with exactly one Undo, rotation, unwire/delete cascade/restore, JSON Save/New/Open preserving rotation/edges/memory, valid/invalid Hex Apply and Undo/Redo.
- All 17 model families rendered/configured; functional 74HC08 and 8-bit memory/display connections succeed, width mismatch fails without adding a wire. Graph structural validation and WebSocket remain connected.
- Browser pointer precision prompted a wire picking-margin regression (RED → fix). Invisible line targets use a camera-scaled margin while displayed wire geometry and graph endpoints remain unchanged.
- Responsive: 1920×1080, 1440×900, 1366×768, 1280×720 PASS; no horizontal body overflow and both open floating windows stay inside workspace. No browser warning/error logs in the tested session.
- Build and final repository/context checks are recorded in the Phase 2 browser report. CI workflow paths include memory/catalog changes; no hosted CI run or push is claimed.

Ruling: keep one demand-driven RAF rendering path without damping/animation because Phase 2 has no simulation engine; Phase 3 may extend scheduling for real signals. Use functional catalog defaults as local configuration, not physical ratings. Keep graph schema 1.0: optional rotation was already accepted by the extensible module schema and is now explicitly typed. Retain unknown imports with fallback visuals instead of inventing mappings.

One fresh read-only final reviewer found two Important issues, both reproduced and fixed as described above; no Critical/Minor findings were reported. No commit/push/deployment was requested or performed.

## Historical Phase 1 record

The following migration evidence describes the earlier shell-only state, before the Phase 2 implementation above.

## Source analysis and migration

The actual source/contracts/tests/CI and supplied icon directory were analyzed in this session. Detailed findings: `docs/SOURCE_ANALYSIS_SINGLE_WORKSPACE.md`. The earlier docs-only redesign identified the six-page routed UI; that diagnosis is now historical.

`App.vue` renders only SingleWorkspaceShell. Legacy and unknown URLs normalize to `/`; router state never selects a lab workflow. Removed seven page components and five old permanent-library/workspace/inspector/dock/analyzer components. New composition:

```text
App/File Bar: New / Open / Save / Undo / Redo
Component Ribbon: twelve specified families
Tool Rail: Select / Wire / Move / Rotate / Delete / Scope / Probe
Dominant Three.js grid + contextual zoom/reset
Status Bar: execution/state/mode/timing/counts/connection
Shared FloatingWindowManager: six contextual window shells
```

Local JSON files obey schema v1 and a shared 2 MB UTF-8 limit. Export falls back to compact serialization before rejecting oversized content; failed export does not mark saved. History retains 50 independent project snapshots. Stale validation guards remain. Session drafts are not server persistence.

`ui` centralizes ribbon/window placement, focus activation and z-order; `workspace` owns exactly one tool; `instrument` keeps configuration shells and bounded event console. Station selection, refresh and structural validation are in Inspector. Existing typed REST and resilient WebSocket implementations remain unchanged.

SceneManager owns graphics, not logical state. ResizeObserver bridges host size and window bounds. Coalesced rendering, pending-frame cancellation, grid geometry/material disposal, renderer disposal and context-recovery listeners establish the Three.js lifecycle foundation.

## Icon and metadata audit

Seventeen supplied SVG files embed PNGs (101,749,162 bytes total). `scripts/prepare_workbench_icons.py` creates committed SVG/WebP thumbnails (43,482 bytes), records original SHA-256 and byte counts, and snapshots canonical starter device metadata. Originals are unchanged. All visible ribbon images loaded in browser verification. Pinouts and electrical parameters are never inferred from images.

## Verification — 2026-10-09

| Check | Evidence |
|---|---|
| Baseline frontend | 20/20 PASS before source changes, outside Windows sandbox. |
| New state/scene/file/router tests | RED missing interfaces/lifecycle → GREEN 28/28. |
| Final review regressions | Focus activation and near-limit file round trip reproduced RED; fixes → npm test 31/31 PASS. |
| Production build | `npm run build` PASS. Vite advisory: large Three.js/application chunk; no build error. |
| Frontend boundaries | `python -m pytest -q tests/frontend`: 9/9 PASS. |
| Whole repository regression | `python -m pytest -q tests services/api/tests services/hardware-service/tests simulator/circuit-simulator/tests`: 44/44 PASS. Existing 3 dependency deprecation warnings. |
| Browser | PASS at 1920×1080, 1440×900, 1366×768, 1280×720. No body horizontal overflow; workspace remains dominant; open windows stay within bounds. |
| Live integration | FastAPI simulation discovery, WebSocket connection/reconnect and Inspector graph validation verified in browser. |
| Commands/windows | New/Open/Save/Undo/Redo, malformed file rejection, supplied icons, tools/zoom, all six window shells, pointer drag/clamp, keyboard movement/Escape, repeated activation and stable focus restoration verified. |
| CI | Frontend workflow triggers updated for artwork/device metadata/script changes. Local workflow checks PASS; no hosted run is claimed before push. |

Browser details: `docs/verification/2026-10-09-single-workspace-browser.md`. Windows sandbox prevents loopback HTTP tests and Vite realpath; the actual verification commands were rerun with approved execution outside it.

## Independent final review

One read-only reviewer found two material issues: ribbon opener focus loss/reselection and pretty exports exceeding the import size limit. Both were reproduced and fixed with regression evidence; final npm suite has 31 passing tests. No additional material defect was identified in import-before-mutation, stale validation, bounds, scene disposal or original-asset exclusion. No minor findings were deferred by the reviewer.

Scope retained: editing/execution/capture are explicit Phase 2+ features; the router's no-op record serves address compatibility only; permissive module properties follow the canonical schema. Costs of these choices are later editor/model/API work, a small temporary compatibility dependency, and leaving logical/electrical validation to the backend. No contract changes or physical driver work occurred.

## Architectural decisions still locked

- Raspberry Pi 5 is the V1 main controller; Web-first / simulation-first.
- Single Workspace is the frontend UX architecture.
- EP4CE6E22C8N without SDRAM is the Experiment Controller prototype.
- EP4CE10E22C8N + 64 MB 16-bit SDR SDRAM is the V1 final direction.
- One FPGA; at least two physical breadboards.
- Physical holes/visual coordinates do not imply independent routing channels or electrical nodes.
- Frontend never imports hardware drivers or accesses device registers directly.

## Historical Phase 1 limitations

Phase 1 provides the shell/grid; it does not place, pick, render or wire logical modules. Tools select an editor mode, not a completed graph-edit action. Run/Stop/Step, acquisition/output, waveform measurements and supported memory editing are unavailable until real contracts/models exist. Projects remain local to the session unless downloaded. Window resizing/minimizing is future work. Vite's large-chunk advisory remains non-blocking.

Device-library coverage is small. gRPC generated bindings/handlers, exact SDRAM/timing, routing architecture/channel count, ADC/DAC/AFE and physical execution remain unimplemented/unselected.

## AI Handoff

### What changed

Phase 2 canonical catalog, separate memory contract, graph command/history layer, scene/models/picking/wires/camera controls, pointer/drag/keyboard interactions, selected Inspector/Hex Editor, lifecycle fixes, tests and Markdown. Preserve historical specs/verification and supplied artwork/axis gizmo.

### Next recommended task

Phase 3: define event-driven simulation and clock, functional catalog/evaluator adapters, output/measurement delivery and memory runtime semantics. Do not treat structural API approval, geometry, local initial bytes or visual sources as execution/electrical truth.

### Required context

Read CONTEXT, ARCHITECTURE, ROADMAP, this log, SOURCE_ANALYSIS_INTERACTIVE_WORKSPACE, Phase 2 spec/plan/browser report, canonical editor/memory contracts and related source/tests. Current limitations: simulation/acquisition/generator output and persistence remain unimplemented; active/controller/notation and dual/quad segment contracts remain pending; physical datasheets/topology/ratings remain unconfirmed. Vite's existing large-chunk advisory is nonblocking.
