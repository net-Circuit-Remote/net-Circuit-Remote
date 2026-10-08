# net*CIRCUIT Remote Architecture

## 1. System goal

net*CIRCUIT Remote is a remote laboratory for digital electronics. Users construct experiments in a Web workspace, validate them in software, run them through a Virtual Hardware Station during early development, and later execute the same model on real logic ICs routed and measured by FPGA hardware.

## 2. Top-level architecture

```text
User Browser
    |
    | HTTPS / REST / WebSocket
    v
Nginx on Raspberry Pi 5
    |----------------------> Vue static frontend
    |
    `--> FastAPI Application Server
              |
              | gRPC / local contract
              v
        Hardware Service
              |
        HardwareStation API
          /                    v             v
VirtualStation   PhysicalStation
(simulator)      (FPGA later)
                      |
                      v
           EP4CE6 prototype / EP4CE10 V1
                      |
                 Routing Fabric
                      |
              Real logic IC hardware
```

## 3. Responsibility boundaries

### Frontend

Owns UI state, workspace interaction, Circuit Graph editing, instrument panels, status presentation and waveform rendering. It **must not** know FPGA registers, chip-select details, raw MUX addresses, Linux device paths or physical switching sequences.

### Application Backend

Owns authentication/session boundaries, Circuit Graph validation, experiment lifecycle, resource locking, storage, WebSocket coordination and high-level policy.

### Hardware Service

Owns Hardware Station discovery, capability reporting, translation from validated logical requests to hardware operations, hardware safety transitions, transport drivers and physical/virtual adapter selection.

### FPGA

Owns deterministic and timing-critical behavior: routing apply sequences, experiment clock, trigger, capture, GPIO timing, Logic Analyzer, SDRAM access and later instrument datapaths.

## 4. Hardware Station abstraction

```text
HardwareStation
├── Experiment Controller
├── Instrument Controller
├── Routing Fabric
├── Breadboard[]
├── Logic IC Resources
└── Measurement Resources
```

Software must not assume that one Hardware Station always contains exactly one FPGA. V1 uses one FPGA architecture, but future Instrument logic may migrate to a second FPGA without changing the Browser-facing model.

## 5. Virtual vs physical execution

Both execution modes follow the same conceptual API: `get_capabilities`, `validate_configuration`, `apply_circuit`, `set_input`, `configure_clock`, `configure_generator`, `configure_trigger`, `arm_capture`, `run`, `stop`, `read_capture`, `safe_state`, and `reset`.

Virtual Hardware is the default development target before FPGA integration. Physical Hardware must never silently fall back to a simulated success state when FPGA hardware is unavailable.

## 6. Circuit Graph flow

```text
Browser Circuit Graph
    -> Backend parse
    -> logical validation
    -> electrical/resource validation
    -> acquire station lock
    -> generate routing plan
    -> Hardware Service
    -> safe state
    -> apply route
    -> configure input/clock/instrument
    -> arm
    -> run/capture
    -> stop
    -> read results
    -> release station
    -> Browser
```

## 7. Control plane and data plane

### Control plane

```text
Browser -> REST/WebSocket command -> FastAPI -> Hardware Service
        -> FPGA control registers -> routing / clock / trigger
```

### Data plane

```text
Real IC / ADC -> FPGA capture -> FIFO / SDRAM -> Hardware Service
              -> Application Backend -> WebSocket binary -> Browser
```

Bulk sample data should use binary transport when appropriate rather than JSON sample-by-sample.

## 8. FPGA development path

### Prototype

`EP4CE6E22C8N`, no external SDRAM. Scope is Experiment Controller bring-up only: clock/reset, device/version registers, communication interface, GPIO, safe-state FSM, basic routing control and basic experiment clock.

### Final V1

`EP4CE10E22C8N` + **64 MB SDR SDRAM, 16-bit**. V1 remains a single-FPGA architecture, with RTL separated into Experiment Control and Instrument domains.

```text
EP4CE10
├── Experiment Control Domain
│   ├── Routing Manager
│   ├── MUX/Crosspoint Control
│   ├── GPIO
│   ├── Experiment Clock
│   └── Safety FSM
└── Instrument Domain
    ├── Trigger
    ├── Logic Analyzer
    ├── Generator
    ├── Acquisition
    ├── Capture Buffer
    └── SDRAM Controller
```

An analog oscilloscope requires an external analog front-end and ADC. An analog/arbitrary waveform generator may require DAC and output analog circuitry.

## 9. Breadboard model

A physical contact is not automatically an independent routing channel.

```text
Physical Contact -> Electrical Node -> Routing Resource
                 -> MUX/Crosspoint -> FPGA-controlled Source/Destination
```

The initial target is at least two physical breadboards. Exact independent routing capacity remains subject to routing IC choice, FPGA I/O, topology, signal integrity and electrical constraints.

## 10. Fault behavior

```text
FAULT -> stop clock -> disable generator -> safe routing -> stop capture
      -> set error -> log -> release or quarantine station
```

Fault sources include timeout, invalid route, resource conflict, disconnect, protocol mismatch, capture overflow, SDRAM error or instrument failure.

## 11. Multi-user model

Concurrent Web users do not equal concurrent independent physical experiments. The application server manages sessions, queueing, reservations and ownership; concurrency of physical experiments is bounded by actual Hardware Stations/resources.

## 12. Web-first integration gate

FPGA integration begins only after milestone **W1 — Web Platform Ready for FPGA Integration**, defined in `ROADMAP.md`.
