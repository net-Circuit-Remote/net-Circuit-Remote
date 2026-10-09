---
project: net-Circuit-Remote
current_phase: single-workspace-shell-complete
status: verified
last_updated: 2026-10-09
next_task: phase-2-component-placement-and-graph-editing
blocking_issue: none
hardware_mode: simulation
fpga_development_started: false
---

# Development Log

## Current Goal

Phase 1 **Single Workspace Shell Migration** is implemented. Continue with Phase 2 metadata-backed placement and Circuit Graph editing, preserving the shell and transport boundaries.

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

## Known limitations

Phase 1 provides the shell/grid; it does not place, pick, render or wire logical modules. Tools select an editor mode, not a completed graph-edit action. Run/Stop/Step, acquisition/output, waveform measurements and supported memory editing are unavailable until real contracts/models exist. Projects remain local to the session unless downloaded. Window resizing/minimizing is future work. Vite's large-chunk advisory remains non-blocking.

Device-library coverage is small. gRPC generated bindings/handlers, exact SDRAM/timing, routing architecture/channel count, ADC/DAC/AFE and physical execution remain unimplemented/unselected.

## AI Handoff

### What changed

Single Workspace source, shared windows, lifecycle, icon pipeline, state/file actions, regression/boundary tests and current documentation. Preserve historical superseded design/plan files.

### Next recommended task

Phase 2 first slice: use canonical device metadata to place one logical module, render its visual separately, pick/select it and route every graph mutation through undo/redo. Avoid inferring electrical connectivity from the visual grid.

### Required context

Read CONTEXT, ARCHITECTURE, ROADMAP, this log, SOURCE_ANALYSIS_SINGLE_WORKSPACE, the approved 2026-10-09 spec and implementation plan, then relevant source/tests/contracts. No commit/push/deployment was performed for this task.
