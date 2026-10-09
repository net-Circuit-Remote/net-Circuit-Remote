# Roadmap

## Status legend

- `[x]` agreed/completed
- `[ ]` not implemented
- `[~]` in progress
- `[S]` superseded by a later approved design

## Phase 0 — Project Architecture

- [x] Select Web-first / simulation-first strategy.
- [x] Select modular monorepo boundary.
- [x] Select software stack.
- [x] Select EP4CE6 prototype and EP4CE10 + 64 MB SDR SDRAM V1 direction.
- [x] Create initial repository scaffold.
- [x] Approve **Single Workspace** frontend architecture on 2026-10-09.
- [S] Previous six-page Dashboard/Laboratory/Circuits/Stations/Experiments/Settings UX.

## Phase 1 — Single Workspace Web Foundation

Reusable Phase 1 engineering already exists:

- [x] Vue 3 + TypeScript + Vite + Pinia foundation.
- [x] Typed API layer.
- [x] WebSocket reconnect/lifecycle foundation.
- [x] Six Pinia store boundaries.
- [x] Frontend runtime tests, boundary checks and reproducible build/CI commands.

UI migration completed on 2026-10-09; evidence in `DEV_LOG.md`:

- [x] Replace routed multi-page shell with one `/` Single Workspace shell.
- [x] Remove visible main-page navigation.
- [x] Add application/file-action bar: New / Open / Save / Undo / Redo (local JSON/project history).
- [x] Add top component ribbon with twelve groups and supplied SVG artwork thumbnails.
- [x] Add left interaction tool rail with seven shared modes.
- [x] Add central workspace shell occupying most of the viewport.
- [x] Add contextual zoom/reset viewport controls.
- [x] Add bottom simulation status bar with honest unavailable execution controls.
- [x] Add shared floating-window manager: drag/focus/keyboard/clamp.
- [x] Add initial instrument window shells: Oscilloscope, Function Generator, Signal Monitor.
- [x] Add Component Info, Inspector and Memory Hex Editor window shells.
- [x] Retire legacy routed page components after references/tests are migrated.
- [x] Keep API/WebSocket/hardware boundary tests green; verify build and desktop browser layout.

## Phase 2 — Interactive Circuit Workspace

- [~] Three.js scene/camera/rendering: disposable on-demand grid lifecycle exists; component rendering/animation remain.
- [ ] Breadboard/board visual model.
- [~] Metadata-driven component palette: supplied artwork and canonical starter metadata previews exist; placement/models remain.
- [ ] Drag component from ribbon to workspace.
- [ ] Component select/move/rotate/delete.
- [ ] Wire/unwire interaction.
- [ ] Zoom/pan/orbit/picking.
- [~] Undo/redo command history: local project operations exist; graph edit commands remain.
- [ ] Circuit Graph generation from workspace operations.
- [x] Local JSON save/open project UX in the Single Workspace (server persistence remains Phase 4).
- [~] Contextual inspector: project/status/validation exists; selected-module editing remains.

Initial component families:

- [ ] Structure / breadboards / boards.
- [ ] Passive: resistor, capacitor and related starter parts.
- [ ] Active/basic transistor/LED representations as supported by simulator scope.
- [ ] Inputs: button, switch, DIP switch, clock.
- [ ] Outputs: LED, seven-segment and probes.
- [ ] Logic ICs.
- [ ] Arithmetic IC/module models: adder and multiplier family abstractions.
- [ ] Memory components with data editor contract.
- [ ] Display components.
- [ ] Labels/notation.

## Phase 3 — Simulator

- [~] Starter combinational logic (74HC08 foundation exists; broader library pending).
- [ ] Combinational device library.
- [ ] Sequential logic models.
- [ ] Virtual clock and event handling.
- [ ] Virtual capture/waveform.
- [ ] Simulated LED/display state linked to Circuit Graph.
- [ ] Function Generator simulation model.
- [ ] Virtual Oscilloscope/Signal Monitor data source.
- [ ] Memory model + Hex Editor integration where supported.

## Phase 4 — Application Backend

- [~] FastAPI application shell and initial validation endpoints.
- [ ] Circuit validation.
- [ ] Save/load circuit.
- [ ] Project persistence.
- [ ] User/session boundary.
- [ ] Experiment lifecycle API.
- [ ] Station capability API refinements required by Single Workspace status UI.

## Phase 5 — Hardware Service

- [ ] gRPC service.
- [~] HardwareStation Python abstraction (gRPC handlers pending).
- [x] VirtualHardwareStation starter implementation.
- [x] PhysicalHardwareStation adapter boundary (driver not implemented).

## Phase 6 — Virtual End-to-End

- [ ] Single Workspace -> backend -> virtual station -> waveform -> floating instrument window.
- [ ] Resource locking.
- [ ] Structured fault handling.
- [ ] End-to-end virtual AND-gate experiment.
- [ ] Virtual clock/counter experiment.
- [ ] Open Oscilloscope/Signal Monitor without leaving circuit workspace.

## Phase 7 — Raspberry Pi Deployment

- [ ] Nginx deployment.
- [ ] systemd services.
- [ ] Raspberry Pi OS 64-bit deployment validation.
- [ ] Validate Single Workspace full-screen usability on Raspberry Pi-served frontend.

## Milestone W1 — Web Platform Ready for FPGA Integration

W1 requires:

- Single Workspace shell active at `/`;
- no legacy multi-page workflow;
- component ribbon and tool rail;
- interactive circuit workspace;
- Circuit Graph;
- save/load;
- validator;
- simulator;
- basic logic models;
- virtual clock;
- virtual Logic Analyzer / Signal Monitor;
- waveform rendering;
- simulated Generator/Oscilloscope UI where applicable;
- FastAPI;
- WebSocket;
- Hardware Service;
- station abstraction;
- session/resource locking;
- structured errors;
- Raspberry Pi deployment;
- automated Virtual end-to-end testing.

FPGA work must not start merely because the GUI looks complete.

## Phase 8 — EP4CE6 Experiment Controller

- [ ] Quartus bring-up.
- [ ] clock/reset.
- [ ] device/version registers.
- [ ] communication interface.
- [ ] GPIO.
- [ ] safe-state FSM.
- [ ] basic routing/MUX control.
- [ ] experiment clock.

## Phase 9 — Raspberry Pi ↔ FPGA Integration

- [ ] Hardware transport.
- [ ] protocol/version compatibility.
- [ ] timeout/fault behavior.

## Phase 10 — Routing Hardware

- [ ] select switching topology.
- [ ] validate electrical constraints.
- [ ] prove safe switching.

## Phase 11 — EP4CE10 Migration

- [ ] retarget Quartus.
- [ ] recompile/timing analysis.
- [ ] resource review.

## Phase 12 — SDR SDRAM 64 MB

- [ ] select exact 16-bit SDR SDRAM part.
- [ ] datasheet-derived timing.
- [ ] controller and memory tests.

## Phase 13 — Logic Analyzer

- [ ] trigger/capture buffer.
- [ ] binary waveform transport.
- [ ] feed Single Workspace Logic Analyzer/Signal Monitor floating window.

## Phase 14 — Generator

- [ ] digital generator baseline.
- [ ] map generator controls from floating UI window to Hardware Service contract.
- [ ] define DAC path if analog/AWG required.

## Phase 15 — Oscilloscope Acquisition

- [ ] select ADC/AFE architecture.
- [ ] acquisition/capture pipeline.
- [ ] map physical capture to Oscilloscope floating window.

## Phase 16 — 2+ Breadboard Integration

- [ ] physical node mapping.
- [ ] routing resource mapping.
- [ ] end-to-end hardware experiment.
- [ ] verify visual board IDs do not become implicit physical channel IDs.

## Phase 17 — Multi-user Validation

- [ ] sessions/queue/ownership.
- [ ] load and recovery tests.
- [ ] preserve one-workspace UX while station ownership changes.

## Phase 18 — Thesis V1

- [ ] measured results.
- [ ] documented limits.
- [ ] reproducible demo.
- [ ] V1 release.
