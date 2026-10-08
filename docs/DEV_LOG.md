---
project: net-Circuit-Remote
current_phase: web-foundation
status: active
last_updated: 2026-10-08
next_task: begin-phase-1-web-foundation
blocking_issue: frontend-build-fix-awaiting-ci-rerun
hardware_mode: simulation
fpga_development_started: false
---

# Development Log

## Current Goal

Begin Phase 1 Web Foundation on top of the verified initial modular monorepo scaffold. Continue using Virtual Hardware; do not start physical FPGA integration before W1.

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

- GitHub Actions Frontend run `37771048734` reproduced a TypeScript tooling failure: missing Node type definitions and missing `Symbol.asyncDispose` library declarations. Local regression test added and passing after the configuration fix; full npm build still requires CI/network re-verification.
Executed in the implementation workspace:

- `python3 scripts/check_context.py` -> **PASS**.
- `pytest -q` -> **38 passed**, **0 failed**, with 2 deprecation warnings from the test-only `jsonschema.RefResolver` API.
- `python3 -m compileall -q services/api services/hardware-service simulator/circuit-simulator scripts` -> **PASS**.
- Device-library JSON parse -> **PASS**.
- GitHub workflow YAML parse -> **PASS**.
- Nginx template syntax through a temporary wrapper configuration -> **PASS**.
- FPGA `iverilog` syntax check -> **SKIPPED** because `iverilog` is not installed in the implementation environment; CI installs it on Ubuntu before the syntax check.
- Frontend dependency install/build -> **IMPLEMENTED — NOT VERIFIED** in this environment because `npm install` failed with DNS/network error `EAI_AGAIN` for `registry.npmjs.org`. Frontend static/boundary tests pass; CI is configured to install dependencies and run `npm run build`.
- Physical FPGA/hardware execution -> **NOT TESTED / NOT IMPLEMENTED** by design.
- Physical Hardware adapter safety delegation -> **PASS**: tests verify operations call the supplied driver and refuse to fake unimplemented driver methods.

## Known Issues / Unknowns

- Frontend CI build fix is applied locally but requires a GitHub Actions rerun to verify `npm run build` in the hosted Node 22 environment.
- `tests/contracts/test_circuit_schema.py` uses deprecated `jsonschema.RefResolver`; tests pass but should migrate to the newer `referencing` API in a later cleanup.
- Exact SDR SDRAM part number and timing are not selected.
- Routing MUX/crosspoint architecture and final independent channel count are not selected.
- ADC/DAC/analog front-end for Oscilloscope/Generator are not selected.
- gRPC generated bindings/handlers are not implemented yet.
- Frontend Three.js circuit workspace is only an explicit placeholder boundary.

## Next Recommended Task

Phase 1 Web Foundation:

1. establish frontend page/layout/navigation structure;
2. add typed API/station capability models;
3. define application state boundaries;
4. add a reproducible frontend test/build setup;
5. then move to Phase 2 Circuit Workspace.

## AI Handoff

### What I changed

Created the initial monorepo scaffold, contracts, software shells, FPGA placeholders, deployment templates, documentation and CI/testing baseline.

### Files modified

Use Git history for the exact file list. The major roots are `apps/`, `services/`, `simulator/`, `fpga/`, `contracts/`, `device-library/`, `deployment/`, `tests/`, `.github/`, `scripts/`, and `docs/`.

### Decisions made

No architectural decision was changed beyond the approved design specification. Where an environment check was unavailable, the status is recorded as not verified rather than assumed successful.

### Tests executed

See **Verification evidence for initial scaffold** above.

### Known failures

No failing Python/static tests at handoff. Frontend full build and local FPGA syntax were not verified for the environment reasons listed above.

### Next recommended task

Begin Phase 1 Web Foundation; keep hardware mode on simulation.

### Context required for next session

Read `CONTEXT.md`, `ARCHITECTURE.md`, `ROADMAP.md`, this file, then the approved design spec and relevant contracts/source before modifying code.
