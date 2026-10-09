# Circuit and Hardware Specification

## 1. Status and evidence policy

This document separates **confirmed architectural decisions** from electrical details that are not yet selected. Unknown FPGA pin assignments, SDRAM part numbers, ADC/DAC devices, MUX/crosspoint devices, voltage limits and timing values must not be invented.

## 2. Confirmed hardware baseline

| Item | V1 decision |
|---|---|
| Main controller | Raspberry Pi 5 |
| Prototype FPGA | EP4CE6E22C8N |
| Prototype SDRAM | None |
| Prototype scope | Experiment Controller only |
| Final FPGA | EP4CE10E22C8N |
| External memory | SDR SDRAM |
| Data width | 16-bit |
| Capacity | 64 MB |
| Breadboards | >= 2 physical boards |

Exact SDRAM manufacturer/part number: **not selected**.

## 3. Breadboard topology model

Definitions:

- **Physical Contact:** an individual insertion hole/contact.
- **Electrical Node:** contacts that are electrically common by breadboard construction or explicit wiring.
- **Routing Resource:** a controllable source/destination exposed to the switching fabric.
- **FPGA GPIO:** an FPGA I/O used by a controller interface; not synonymous with a breadboard contact.

Therefore, a design input such as ~260 physical contacts across two breadboards **does not establish 260 independently routable channels**.

## 4. Circuit Graph v1.0

Application-level graph:

```json
{
  "schema_version": "1.0",
  "circuit_id": "exp-001",
  "modules": [
    {"id": "SW1", "type": "DIGITAL_SWITCH"},
    {"id": "U1", "type": "74HC08"}
  ],
  "connections": [
    {"source": "SW1.OUT", "destination": "U1.A1"}
  ]
}
```

Canonical JSON Schemas live under `contracts/circuit-schema/`.

Phase 2 modules may include world `position: {x,y,z}` and yaw `rotation` in degrees around Y. XZ is the visual work surface; these values never define a net. Command operations use stable module IDs and metadata port IDs, with finite geometry, cascade deletion and independent history. Local file guards additionally check unique IDs, existing endpoint modules and optional memory images. Unknown imported types/port names remain available for inspection; no pin map is inferred.

`device-library/editor/components.json` defines functional ports/directions/widths and visual/configuration defaults. 74HC08 A1/B1/Y1…A4/B4/Y4 are logical gates, not physical DIP pin numbers. Adder/Multiplier have generic 8-bit operand contracts, no selected part number. Breadboard/Board/Power supply visuals have no ports; no real power source is assumed. Passive values and requested clock frequency are local model configuration, not confirmed hardware ratings.

Generic memory uses `contracts/memory/memory-image.schema.json`: version 1.0, 8-bit words, 1–256 bytes, data length exactly depth. Its image lives in `properties.memory`, is explicitly zero-initialized for new instances and is editable/undoable through Hex Editor. It is separate from physical SDRAM, capture and future memory execution/timing semantics.

Editor connection checks reject direction/width mismatches, duplicate wires and second input drivers; output fanout is permitted. Passive `inout` connections need future net/electrical analysis. Backend structural validation alone remains insufficient to authorize physical execution.

## 5. Device metadata

A device definition should eventually describe at least:

```text
id
type
package
logical_ports[]
electrical_rules[]
resource_requirements
visual_model
simulation_model
```

Electrical values remain absent until supported by the selected component datasheet.

## 6. Hardware capability descriptor

A station reports capabilities instead of forcing the frontend to hard-code them. Example fields:

```text
station_id
station_version
breadboards[]
experiment_controller
instruments.logic_analyzer
instruments.generator
instruments.oscilloscope
protocol_versions
```

## 7. FPGA protocol version domains

These versions are independent:

- FPGA Protocol Version
- FPGA Register Map Version
- Circuit Schema Version
- Hardware RPC Version
- Application release version

Planned identification registers include device ID, firmware version, protocol version and register-map version. Exact register addresses are reserved in `contracts/fpga-protocol/register-map.md` and are not final hardware commitments yet.

## 8. Safety requirements

The physical implementation must prevent unsafe output-to-output drive and unsupported multi-driver connections. Routing must move through a safe transition state before new switching is applied. Experiment clock and generator outputs must be stopped/disabled during fault handling when required by the hardware design.

## 9. Oscilloscope and Generator boundary

An analog oscilloscope requires external protection/attenuation/amplification as applicable and an ADC. An analog/arbitrary generator requires a DAC and appropriate output stage. FPGA logic alone is not an analog measurement/generation front-end.

## 10. Pending electrical decisions

The following are intentionally unresolved until parts and datasheets are selected:

- exact SDR SDRAM part number and timing;
- MUX/crosspoint topology and part numbers;
- level shifting/buffering;
- ADC/DAC and analog front-end;
- physical connector mapping;
- FPGA bank voltages and pin assignments;
- final independent routing channel count;
- supported experiment frequency limits.

## Component pose and visual supply clarification — 2026-10-09

Transform gizmo preview does not change Circuit Graph. Release commits position or Y rotation through existing schema 1.0 commands/history; cancel restores committed geometry. Named ports/wires retain identities. Workspace Object Snap, docking, arbitrary-angle footprints and decorative supply terminals never create electrical nodes. Bench supply readouts remain unknown/OFF; no physical source or measurement is implied.
