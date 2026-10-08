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
5. Read task-specific specs/contracts.
6. Inspect related source and tests.
7. Plan the smallest safe change.

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
