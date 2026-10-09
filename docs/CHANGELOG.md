# Changelog

All notable project changes will be documented in this file. The project follows Keep-a-Changelog-style sections and Semantic Versioning for application releases.

## [Unreleased]

### Implemented — 2026-10-09 Single Workspace shell

- Replaced App's page shell with SingleWorkspaceShell. Legacy/unknown URLs redirect to `/`; deleted seven routed pages and five legacy sidebar/workspace/dock components.
- Added New/Open/Save/Undo/Redo with local schema v1 JSON, structural/size guards, independent bounded history and stale validation invalidation. Large exports use compact JSON when pretty-printing would exceed the import limit; failed exports do not mark the project saved.
- Added twelve component families using supplied artwork, seven shared tool modes, dominant Three.js grid, contextual zoom/reset controls and simulation/status/count/connection presentation.
- Added six shared floating shells with dragging, bounded reflow, z-order, explicit activation, arrow-key movement, Escape and stable ribbon focus restoration.
- Preserved typed API, WebSocket reconnect and all six store boundaries. Inspector provides real station discovery, graph validation and bounded event console.
- Generated seventeen provenance-checked SVG thumbnails: 101,749,162 source bytes → 43,482 output bytes. Canonical device-library snapshots supply available metadata.
- Added state/file/router/scene regression tests and updated frontend CI triggers/boundary checks. Exact verification is recorded in DEV_LOG; placement, execution, acquisition and memory models remain later phases.

### Changed — 2026-10-09 Single Workspace architecture

- Approved a frontend redesign from the previous six-page Web shell to a **Single Workspace** virtual-electronics workbench.
- `/` is now the target entry point for the laboratory workspace; Dashboard / Circuits / Stations / Experiments / Settings are superseded as user-facing navigation concepts.
- Approved the target UI composition: app/file bar, top component ribbon, left interaction tool rail, dominant central Three.js workspace, contextual viewport controls, bottom simulation status bar and floating tool/instrument windows.
- Approved floating Oscilloscope, Function Generator, Signal Monitor/Logic Analyzer, Component/IC Info, Inspector and Memory Hex Editor concepts.
- Updated AI instructions so future implementation follows the supplied reference images and CRUMB-like workflow inspiration without copying proprietary source/assets pixel-for-pixel.
- Reopened the frontend shell work as `single-workspace-ui-migration`; existing typed API, WebSocket and Pinia boundaries are intended to be reused.
- Marked the previous Web Foundation multi-page design/spec as **SUPERSEDED**.

### Notes

- The initial 2026-10-09 architecture update was documentation-only; the subsequent source migration is implemented as recorded above.
- Exact SDRAM, routing IC, ADC, DAC and FPGA pin mappings remain intentionally unselected.

### Historical — Phase 1 Web Foundation (superseded UI shell, reusable infrastructure retained)

The following items were implemented on 2026-10-08 and remain useful engineering history. The page/layout decisions are superseded; transport/state/test infrastructure may be reused.

- Six routed pages and the old desktop Laboratory layout.
- Six separate Pinia stores.
- Typed API client/domain services, structured validation outcomes and explicit simulation/hardware status adapter.
- Resilient event WebSocket with capped exponential reconnect, station rediscovery and lifecycle cleanup.
- Session-only circuit drafts and backend-driven station discovery/graph validation.
- Frontend runtime tests with TypeScript checking; CI uses locked dependency installation, tests, build and source boundary checks.

### Initial Scaffold

- Approved architecture baseline for Web-first development.
- Modular monorepo design.
- Raspberry Pi 5 / Vue / FastAPI / Hardware Service technology baseline.
- EP4CE6 Experiment Controller prototype direction.
- EP4CE10E22C8N + 64 MB 16-bit SDR SDRAM V1 direction.
- Hardware Station and Circuit Graph abstractions.
- AI context-drift prevention documentation workflow.
- Added Vue/Vite frontend shell and explicit Three.js workspace boundary.
- Added FastAPI application backend shell with health/station/circuit-validation endpoints.
- Added Hardware Station abstraction with Virtual/Physical implementations.
- Added starter circuit simulator and 74HC08 functional model.
- Added FPGA directory structure and compile-safe placeholder top module.
- Added Nginx/systemd/Raspberry Pi deployment templates.
- Added GitHub Actions starter workflows and integration/context checks.
- Hardened the Physical Hardware adapter so it delegates to a real driver and never fabricates successful physical operations.

### Fixed

- Reject malformed station states and preserve the selected mode when a target changes its reported mode.
- Prevent stale discovery and circuit validation responses from replacing newer state.
- Wrap long circuit names in the legacy Inspector; run context subprocess checks with the current Python executable on Windows and Linux.
- Fixed frontend TypeScript CI build configuration by adding Node.js type definitions and the `ESNext.Disposable` library required by current Vite/Rollup declarations.
