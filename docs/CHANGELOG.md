# Changelog

All notable project changes will be documented in this file. The project follows Keep-a-Changelog-style sections and Semantic Versioning for application releases.

## [Unreleased]

### Added

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

### Notes

- Exact SDRAM, routing IC, ADC, DAC and FPGA pin mappings are intentionally not selected yet.
