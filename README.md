# net*CIRCUIT Remote

**net*CIRCUIT Remote** is a Web-first remote digital-electronics laboratory platform designed to let users build experiments in a browser, validate/simulate them in software, and later execute the same experiment model on real logic IC hardware controlled by FPGA through a Raspberry Pi 5.

> **Repository status:** initial architecture + software scaffold. Virtual Hardware foundations are present. Physical FPGA control, SDRAM, Generator, Oscilloscope acquisition, routing hardware, and production deployment are **not implemented yet**.

## V1 architecture baseline

| Layer | Baseline |
|---|---|
| Frontend | Vue 3 + TypeScript + Vite + Pinia + Three.js boundary |
| Application backend | Python + FastAPI + Pydantic + SQLAlchemy + WebSocket |
| Hardware backend | Python + gRPC/Protobuf + Hardware Station abstraction |
| Database | SQLite |
| Main controller | Raspberry Pi 5, Raspberry Pi OS 64-bit |
| Web server | Nginx |
| Process manager | systemd |
| Prototype FPGA | Cyclone IV EP4CE6E22C8N, no SDRAM, Experiment Controller only |
| Final V1 FPGA | Cyclone IV EP4CE10E22C8N |
| Final V1 memory | 64 MB SDR SDRAM, 16-bit |
| Breadboard target | >= 2 physical breadboards |

## Core boundary

```text
Browser
   |
   | REST / WebSocket
   v
FastAPI Application Backend
   |
   | Hardware contract
   v
Hardware Service
   |
   v
Hardware Station
   |----------------------|
   v                      v
Virtual Hardware      Physical Hardware
(now)                 (FPGA later)
```

The Browser never directly writes FPGA registers, raw MUX addresses, or Linux SPI devices. It produces a **Circuit Graph**; backend layers validate and translate that graph before any physical action.

## Repository structure

```text
net-Circuit-Remote/
├── apps/web/                         Vue browser application
├── services/api/                     FastAPI application backend
├── services/hardware-service/        Hardware Station abstraction
├── simulator/circuit-simulator/      Virtual digital hardware simulator
├── fpga/                             Verilog/Quartus workspace
├── contracts/                        Circuit/API/hardware/FPGA contracts
├── device-library/                   Device and breadboard metadata
├── deployment/                       Nginx/systemd/Raspberry Pi templates
├── tests/                            Cross-subsystem tests
├── scripts/                          Context/development helpers
├── docs/                             Architecture and project context
└── .github/workflows/                CI starter workflows
```

## Read this before development

AI agents and human contributors should read in this order:

1. [`docs/CONTEXT.md`](docs/CONTEXT.md)
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
3. [`docs/ROADMAP.md`](docs/ROADMAP.md)
4. [`docs/DEV_LOG.md`](docs/DEV_LOG.md)
5. [`docs/CIRCUIT_SPEC.md`](docs/CIRCUIT_SPEC.md) when working on hardware/contracts

The approved architecture specification is in `docs/superpowers/specs/2026-10-08-net-circuit-remote-architecture-design.md`.

## Quick start — verification

From the repository root, in a development environment where the Python test dependencies for the relevant subsystems are installed:

```bash
python3 scripts/check_context.py
pytest -q
```

The scaffold's Python/static test suite does not require physical FPGA hardware. Each Python subsystem declares its own test dependencies in its `pyproject.toml`; CI workflows install the dependencies needed by their scope.

## Quick start — Web frontend

```bash
cd apps/web
npm install
npm run dev
```

Production build:

```bash
npm run build
```

The current Web UI is a shell. The full Three.js breadboard/circuit editor belongs to later Web phases.

## Quick start — Application Backend

```bash
cd services/api
python3 -m venv .venv
. .venv/bin/activate
pip install -e '.[test]'
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Initial endpoints:

- `GET /api/health`
- `POST /api/circuits/validate`
- `GET /api/stations`
- `WS /ws/events`

## Quick start — Hardware Service tests

```bash
pytest -q services/hardware-service/tests
```

`VirtualHardwareStation` is the early-development implementation. `PhysicalHardwareStation` intentionally reports unavailable until a real FPGA driver is provided.

The gRPC server file is only a transport shell at this stage; generated Protobuf service bindings and handlers are not yet registered.

## Quick start — Circuit Simulator

```bash
pytest -q simulator/circuit-simulator/tests
```

The initial simulator contains deterministic digital primitives and a starter 74HC08 AND model. It is not a SPICE/timing-accurate analog simulator.

## FPGA development path

FPGA work starts only after the Web platform reaches **Milestone W1** in `docs/ROADMAP.md`.

```text
Web + Virtual Hardware
        |
        v
W1 ready for FPGA integration
        |
        v
EP4CE6E22C8N
Experiment Controller prototype
(no SDRAM)
        |
        v
EP4CE10E22C8N
+ 64 MB SDR SDRAM 16-bit
        |
        +-- Experiment Control Domain
        `-- Instrument Domain
```

The FPGA workspace currently contains only a compile-safe placeholder top module and documentation boundaries. It does **not** implement SPI, routing, SDRAM, Logic Analyzer, Generator, or Oscilloscope functions yet.

## Breadboard routing note

Physical breadboard holes are not equivalent to independent FPGA channels:

```text
Physical Contact
      -> Electrical Node
      -> Routing Resource
      -> MUX / Crosspoint / Switching Fabric
      -> FPGA-controlled Source or Destination
```

The exact independent routing count remains uncommitted until the switching architecture and electrical design are selected.

## Raspberry Pi deployment

Starter templates live in `deployment/`. The baseline topology is:

```text
Browser -> Nginx (:80/:443 later)
             |-> static Vue files
             `-> FastAPI 127.0.0.1:8000
                       |
                       `-> Hardware Service 127.0.0.1:50051
```

These are starter templates, not a production-security claim. TLS/authentication/firewall/secrets hardening remain future work.

## Project history and handoff

- `docs/CHANGELOG.md` — release-facing changes
- `docs/DEV_LOG.md` — current state, verification evidence, next task, AI handoff
- `docs/CONTEXT.md` — architectural rules that must not silently drift

## License

No project license has been selected in this scaffold. Add a [LICENSE](https://github.com/net-Circuit-Remote/net-Circuit-Remote/blob/main/LICENSE) only after the project owner chooses one.
