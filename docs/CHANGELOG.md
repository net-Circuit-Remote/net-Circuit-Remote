# Changelog

All notable project changes will be documented in this file. The project follows Keep-a-Changelog-style sections and Semantic Versioning for application releases.

## [Unreleased]

### Added

- Phase 1 Web Foundation: six routed pages, desktop Laboratory layout with library/inspector/instrument dock, and six separate Pinia stores.
- Typed API client/domain services, structured validation outcomes and explicit simulation/hardware status adapter.
- Resilient event WebSocket with capped exponential reconnect, station rediscovery and lifecycle cleanup.
- Session-only circuit drafts and backend-driven station discovery/graph validation.
- Frontend runtime tests with TypeScript checking; CI uses locked dependency installation, tests, build and source boundary checks.

- Approved architecture baseline for Web-first development.
- Modular monorepo design.
- Raspberry Pi 5 / Vue / FastAPI / Hardware Service technology baseline.
- EP4CE6 Experiment Controller prototype direction.
- EP4CE10E22C8N + 64 MB 16-bit SDR SDRAM V1 direction.
- Hardware Station and Circuit Graph abstractions.
- AI context-drift prevention documentation workflow.


### Initial Scaffold

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
- Wrap long circuit names in the Inspector; run context subprocess checks with the current Python executable on Windows and Linux.

- Fixed frontend TypeScript CI build configuration by adding Node.js type definitions and the `ESNext.Disposable` library required by current Vite/Rollup declarations.

### Notes

- Exact SDRAM, routing IC, ADC, DAC and FPGA pin mappings are intentionally not selected yet.
