---
project: net-Circuit-Remote
current_phase: web-foundation
status: active
last_updated: 2026-10-08
next_task: begin-phase-2-circuit-workspace
blocking_issue: none
hardware_mode: simulation
fpga_development_started: false
---

# Development Log

## Current Goal

Phase 1 Web Foundation is implemented and locally verified. Next, begin Phase 2 Circuit Workspace on the routed application and separate state/service boundaries. Continue using Virtual Hardware; do not start physical FPGA integration before W1.

## Completed in this scaffold

- Architecture/spec/context documentation baseline.
- Circuit Graph JSON Schema v1.0 starter.
- FPGA protocol/register-map placeholder documentation with independent version domains.
- Vue 3 + TypeScript + Vite frontend shell.
- FastAPI application backend shell and Circuit Graph structural validation.
- Hardware Station abstraction with Virtual and Physical adapter boundaries.
- Starter digital simulator and 74HC08 functional model.
- FPGA workspace split into common, Experiment Controller, Instrument, simulation, constraints and Quartus boundaries.
- Nginx/systemd/Raspberry Pi deployment templates.
- GitHub Actions starter workflows.
- Integration and context-drift checks.

## Architectural decisions still locked

- Raspberry Pi 5 is V1 main controller.
- Web-first / simulation-first development.
- EP4CE6E22C8N without SDRAM is the Experiment Controller prototype target.
- EP4CE10E22C8N + 64 MB 16-bit SDR SDRAM is the V1 final direction.
- V1 uses a one-FPGA architecture.
- Target is at least two physical breadboards.
- Physical breadboard holes are not assumed to be independent routing channels.

## Verification evidence for initial scaffold

- GitHub Actions Frontend CI and local build verification: TypeScript tooling configuration resolved (Node type definitions and `Symbol.asyncDispose` declarations added). Full build verified (`npm run build` PASS with vue-tsc typecheck and Vite production bundle).
Executed in the implementation workspace:

- `python3 scripts/check_context.py` -> **PASS**.
- `pytest -q` -> **38 passed**, **0 failed**, with 2 deprecation warnings from the test-only `jsonschema.RefResolver` API.
- `python3 -m compileall -q services/api services/hardware-service simulator/circuit-simulator scripts` -> **PASS**.
- Device-library JSON parse -> **PASS**.
- GitHub workflow YAML parse -> **PASS**.
- Nginx template syntax through a temporary wrapper configuration -> **PASS**.
- FPGA `iverilog` syntax check -> **SKIPPED** because `iverilog` is not installed in the implementation environment; CI installs it on Ubuntu before the syntax check.
- Frontend dependency install/build -> **PASS**: dependencies installed and `npm run build` succeeds (`vue-tsc` typecheck passes, Vite generates production bundle).
- Physical FPGA/hardware execution -> **NOT TESTED / NOT IMPLEMENTED** by design.
- Physical Hardware adapter safety delegation -> **PASS**: tests verify operations call the supplied driver and refuse to fake unimplemented driver methods.

## Phase 1 Web Foundation — 2026-10-08

Implemented shared navigation and six history routes, desktop Laboratory library/workspace/inspector/dock layout, six Pinia stores, typed domain API services, five execution statuses, and a reconnecting event client. Circuits manages session-only drafts and actual backend structural validation; Stations discovers/selects actual backend targets. Dashboard, Experiments and Settings have their foundation pages. The frontend contains no physical driver imports.

Verification performed on the final implementation:

- `npm ci --no-audit --no-fund` -> **PASS**, using the committed dependency lockfile.
- `npm test` -> **20 passed**, **0 failed**; includes TypeScript checking of source/tests, real local HTTP API checks, malformed responses, cancellation/timeout, status adaptation, stale request protection, and WebSocket reconnect/reset/cleanup.
- `npm run build` -> **PASS** (`vue-tsc` and Vite production bundle; six page chunks).
- `python -m pytest -q tests services/api/tests services/hardware-service/tests simulator/circuit-simulator/tests` -> **41 passed**, **0 failed**. This covers every repository test suite. Three dependency deprecation warnings: two existing `jsonschema.RefResolver` warnings and a TestClient/httpx warning from the temporary current FastAPI/Starlette verification environment.
- Frontend boundary checks -> **6 passed**, included in the full Python run; fetch is centralized and all frontend imports stay inside the allowed source/package boundary.
- Context check -> **PASS**; Git diff whitespace check -> **PASS**.
- Browser checks -> **PASS** at 1024, 1280, 1440 and 390 px; no body horizontal overflow, including a 100-character unbroken circuit name. Verified navigation, circuit create/open/rename, component preview, Settings panel visibility, keyboard dock navigation, live station discovery/selection and graph validation through the existing FastAPI backend.
- Live event recovery -> **PASS**: client initially retried while the API was absent, then connected when the simulation backend started. Connection lifecycle is displayed separately from execution status, and station discovery refreshes when a connection opens.
- Independent read-only review identified mode-change fallback, malformed array-valued station state, and Inspector name overflow. All three were reproduced and corrected; runtime regressions and browser rechecks pass.
- Frontend workflow now uses `npm ci`, runtime tests, build and Python boundary checks. Equivalent commands passed locally. **Hosted GitHub Actions for these unpushed changes has not run.**

Windows verification uses the bundled Python with temporary, git-ignored dependencies in `.superpowers/python-deps` and UTF-8 mode. Restricted sandbox filesystem/loopback/thread operations prevented some initial build/test runs; final build, runtime tests and full regression ran successfully outside that sandbox. The root context subprocess test now uses `sys.executable` for portability.

Phase limits: circuit drafts/preferences are lost on reload; experiment REST endpoints are typed reserved interfaces, not implemented backend endpoints and not requested by pages. 3D editing, waveform capture, persistence, locking and physical execution remain future work. Structural graph validation is not electrical approval or simulation execution.

## Known Issues / Unknowns

- `tests/contracts/test_circuit_schema.py` uses deprecated `jsonschema.RefResolver`; tests pass but should migrate to the newer `referencing` API in a later cleanup.
- Exact SDR SDRAM part number and timing are not selected.
- Routing MUX/crosspoint architecture and final independent channel count are not selected.
- ADC/DAC/analog front-end for Oscilloscope/Generator are not selected.
- gRPC generated bindings/handlers are not implemented yet.
- Frontend Three.js circuit workspace is only an explicit placeholder boundary.

## Next Recommended Task

Phase 2 Circuit Workspace: build the Three.js workspace and breadboard model, then component placement/removal and logical wiring. Reuse `circuit.ts` for graph ownership and `workspace.ts` for interaction state. Preserve the typed API boundaries and avoid inventing station resource counts or electrical parameters.

## AI Handoff

### What I changed

Extended the initial scaffold with the Phase 1 frontend implementation, runtime tests, CI updates, application API documentation and this verification record.

### Files modified

Use Git history for the exact file list. The major roots are `apps/`, `services/`, `simulator/`, `fpga/`, `contracts/`, `device-library/`, `deployment/`, `tests/`, `.github/`, `scripts/`, and `docs/`.

### Decisions made

No architectural decision was changed beyond the approved design specification. Where an environment check was unavailable, the status is recorded as not verified rather than assumed successful.

### Tests executed

See **Phase 1 Web Foundation — 2026-10-08** above for current evidence; initial-scaffold evidence is retained separately.

### Known failures

No failing frontend or Python tests at handoff. Hosted CI awaits a pushed commit. Physical execution and local FPGA syntax are outside this Phase 1 change.

### Next recommended task

Begin Phase 2 Circuit Workspace; keep hardware mode on simulation.

### Context required for next session

Read `CONTEXT.md`, `ARCHITECTURE.md`, `ROADMAP.md`, this file, then the approved design spec and relevant contracts/source before modifying code.
