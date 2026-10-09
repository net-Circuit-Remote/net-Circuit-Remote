# CONTEXT — net*CIRCUIT Remote Project Constitution

This file is the first document an AI or new contributor must read. It records architectural decisions that must not drift silently between sessions.

## 1. Project identity

**Project:** net*CIRCUIT Remote  
**Purpose:** remote digital-electronics laboratory using real logic ICs, Web control and FPGA real-time hardware.

## 2. Immutable-until-approved decisions

- Main controller: **Raspberry Pi 5**.
- OS baseline: Raspberry Pi OS 64-bit.
- Frontend: **Vue 3 + TypeScript + Vite + Pinia + Three.js**.
- Application backend: **Python + FastAPI + Pydantic + SQLAlchemy + WebSocket**.
- Hardware backend: **Python + gRPC + Protobuf**.
- Database baseline: **SQLite**.
- Deployment baseline: **Nginx + systemd**.
- Development strategy: **Web-first**, simulation-first, FPGA integration later.
- Frontend UX architecture: **Single Workspace**, desktop-style virtual electronics workbench.
- `/` opens the laboratory workspace directly; do not rebuild the product around Dashboard / Circuits / Stations / Experiments / Settings pages.
- Approved workbench layout: application/file actions at top, component ribbon below, left interaction tool rail, dominant central Three.js workspace, bottom simulation status bar, contextual/floating instrument windows.
- Reference images and CRUMB-like workflows are inspiration for interaction and density only; do not copy proprietary source, branding, icons or assets pixel-for-pixel.
- Prototype FPGA: **EP4CE6E22C8N**, no SDRAM, Experiment Controller only.
- Final V1 FPGA: **EP4CE10E22C8N**.
- Final V1 external memory: **64 MB SDR SDRAM, 16-bit**.
- Final V1 architecture: **one FPGA** unless evidence later justifies splitting.
- Breadboard target: **at least two physical breadboards**.
- RTL must remain portable EP4CE6 -> EP4CE10 where practical.
- Timing-critical operations belong in FPGA, not Linux userspace.
- Frontend must never directly access raw FPGA registers, Linux SPI device paths or raw MUX addresses.
- Backend validates Circuit Graph and hardware policy before physical execution.
- Breadboard holes must never be equated directly with FPGA GPIO or independent routing channels.
- Unknown electrical values, part numbers and timing values must never be invented.

## 3. Required session-start protocol

Before editing code:

1. Read `docs/CONTEXT.md`.
2. Read `docs/ARCHITECTURE.md`.
3. Read `docs/ROADMAP.md`.
4. Read `docs/DEV_LOG.md`.
5. For frontend work, read `docs/superpowers/specs/2026-10-09-single-workspace-ui-design.md`.
6. Read task-specific specs/contracts.
7. Inspect related source and tests.
8. Plan the smallest safe change.

## 4. Required session-end protocol

After meaningful work:

1. Run relevant verification.
2. Update affected docs/contracts when required.
3. Update `docs/DEV_LOG.md`.
4. Record tests actually run and any checks that were not available.
5. Never write “working”, “fixed”, or “done” without current evidence.

## 5. Boundary rules

### Frontend may depend on

Application API, WebSocket protocol, Circuit Graph and capability descriptors.

### Frontend must not depend on

FPGA register maps, physical SPI details, raw MUX/crosspoint addressing or hardware driver implementation.

### Application backend may depend on

Circuit contracts and Hardware Service contract.

### Hardware Service may depend on

Hardware RPC contract, FPGA protocol/driver implementation and simulator adapter.

### FPGA may depend on

Documented register/protocol contracts and hardware electrical design; it does not implement Web/session logic.

## 6. Contract-change rule

Before an incompatible contract change:

- identify all consumers;
- version the contract;
- update tests;
- update documentation;
- update `CHANGELOG.md` when release-visible.

## 7. Architectural-change rule

Changing an immutable decision requires explicit reasoning, trade-off analysis, user approval, update to `ARCHITECTURE.md`/`CONTEXT.md`, and a changelog entry when applicable.

## 8. Definition of Done

A task is complete only when implementation exists, relevant tests pass, known regressions are absent, affected documentation is updated and DEV_LOG is updated. If verification cannot be performed, use **IMPLEMENTED — NOT VERIFIED**.

## 9. Source style

- Prefer small modules with one responsibility.
- Preserve public contracts across internal refactors.
- Use structured error codes instead of generic `error` strings.
- Do not hard-code future resource counts unless the hardware design proves them.
- Add comments for architectural constraints, not for obvious syntax.
- Keep hardware-specific assumptions out of frontend code.

## 10. FPGA rules

- Synthesizable Verilog HDL for RTL.
- Clear reset behavior.
- Avoid unintended latches and arbitrary gated clocks.
- Treat CDC/metastability explicitly.
- Keep common RTL separate from target-specific constraints.
- EP4CE6 source is a prototype target, not the permanent resource ceiling.
- Do not claim SDRAM timing correctness until the exact SDRAM datasheet is selected and used.


## 11. Single Workspace frontend rules

- Treat the old six-page Vue Router design as **superseded**.
- Do not add new Dashboard/Circuits/Stations/Experiments/Settings UI.
- Route-level separation must not be used to hide core lab tools; core lab interaction stays in one workspace.
- Prefer component ribbon + contextual menus for component insertion.
- Prefer floating windows for instruments, memory editors and detailed inspectors.
- Keep the circuit workspace visible while instruments are open.
- Keep UI state separate from Circuit Graph electrical state.
- Component/library definitions must be metadata-driven.
- Visual 3D position must never define an electrical node.
- Preserve typed API/WebSocket/hardware boundaries during UI migration.
- Do not claim the Single Workspace source migration is complete until frontend tests and production build pass.

## 12. Current frontend implementation — 2026-10-09

Single Workspace Phase 1 is implemented. App renders one shell; legacy/unknown URLs redirect to `/`. No legacy page components, permanent inspector/library columns or bottom dock remain. Six Pinia stores and typed REST/WebSocket boundaries are retained. Project file/history actions are local JSON; scene resources stay outside stores. Shared floating windows support activation/focus, drag, keyboard movement/Escape and viewport clamping.

Use supplied artwork through the committed thumbnails in `apps/web/src/assets/icons`; regenerate with `scripts/prepare_workbench_icons.py` after source artwork/device metadata changes. Do not bundle the large original SVG/embedded-PNG files. Read `docs/SOURCE_ANALYSIS_SINGLE_WORKSPACE.md` and the current DEV_LOG before Phase 2.

Next work: metadata-backed placement, picking and graph edit commands. The grid and tool modes do not yet edit a circuit. Run/Stop/Step, acquisition, generator output and memory editing require real contracts; keep their current unavailable states honest.
