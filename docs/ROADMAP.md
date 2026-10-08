# Roadmap

## Status legend

- `[x]` agreed/completed at architecture level
- `[ ]` not implemented
- `[~]` in progress

## Phase 0 — Project Architecture

- [x] Select Web-first / simulation-first strategy.
- [x] Select modular monorepo boundary.
- [x] Select software stack.
- [x] Select EP4CE6 prototype and EP4CE10 + 64 MB SDR SDRAM V1 direction.
- [x] Create initial repository scaffold.

## Phase 1 — Web Foundation

- [x] Vue application shell.
- [x] Layout/navigation/state management (six pages, Laboratory panels, six Pinia stores).
- [x] Typed API/WebSocket clients (response validation, status adapter, reconnect and cleanup).
- [x] Frontend runtime tests, boundary checks and reproducible build/CI commands.

## Phase 2 — Circuit Workspace

- [ ] Three.js laboratory workspace.
- [ ] Breadboard visual model.
- [ ] Component place/remove.
- [ ] Wire/unwire.
- [ ] Circuit Graph generation.

## Phase 3 — Simulator

- [~] Starter combinational logic (74HC08 foundation exists; broader library pending).
- [ ] Sequential logic models.
- [ ] virtual clock and event handling.
- [ ] virtual capture/waveform.

## Phase 4 — Application Backend

- [~] FastAPI application shell and initial validation endpoints.
- [ ] circuit validation.
- [ ] save/load circuit.
- [ ] user/session boundary.

## Phase 5 — Hardware Service

- [ ] gRPC service.
- [~] HardwareStation Python abstraction (gRPC handlers pending).
- [x] VirtualHardwareStation starter implementation.
- [x] PhysicalHardwareStation adapter boundary (driver not implemented).

## Phase 6 — Virtual End-to-End

- [ ] Browser -> backend -> virtual station -> waveform -> Browser.
- [ ] resource locking.
- [ ] structured fault handling.

## Phase 7 — Raspberry Pi Deployment

- [ ] Nginx deployment.
- [ ] systemd services.
- [ ] Raspberry Pi OS 64-bit deployment validation.

## Milestone W1 — Web Platform Ready for FPGA Integration

W1 requires: working Web UI shell and circuit workspace, Circuit Graph, save/load, validator, simulator, basic logic models, virtual clock, virtual Logic Analyzer, waveform rendering, FastAPI, WebSocket, Hardware Service, station abstraction, session/resource locking, structured errors, Pi deployment and automated Virtual end-to-end testing.

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

## Phase 14 — Generator

- [ ] digital generator baseline.
- [ ] define DAC path if analog/AWG required.

## Phase 15 — Oscilloscope Acquisition

- [ ] select ADC/AFE architecture.
- [ ] acquisition/capture pipeline.

## Phase 16 — 2+ Breadboard Integration

- [ ] physical node mapping.
- [ ] routing resource mapping.
- [ ] end-to-end hardware experiment.

## Phase 17 — Multi-user Validation

- [ ] sessions/queue/ownership.
- [ ] load and recovery tests.

## Phase 18 — Thesis V1

- [ ] measured results.
- [ ] documented limits.
- [ ] reproducible demo.
- [ ] V1 release.
