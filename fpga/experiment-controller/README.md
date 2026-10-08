# Experiment Controller

## Development target

- Intel/Altera Cyclone IV **EP4CE6E22C8N**
- **no external SDRAM**
- purpose: bring-up and validate the Experiment Controller architecture only

Initial future scope:

- reset/clock bring-up;
- device/version identification;
- Raspberry Pi communication interface;
- GPIO;
- safe-state FSM;
- basic routing/MUX control;
- basic experiment clock.

## Migration target

The same architecture is intended to migrate to **EP4CE10E22C8N** for V1. Do not treat EP4CE6 as the permanent resource ceiling.

The current `rtl/top.v` is only a compile-safe placeholder. It implements no hardware protocol or experiment functionality.
