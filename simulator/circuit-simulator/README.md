# Circuit Simulator

Software-only Virtual Hardware foundation used before FPGA integration.

The initial implementation intentionally contains only deterministic digital primitives and a starter 74HC08 functional model. It is not a timing-accurate SPICE simulator and does not claim to model propagation delay, analog behavior, or real hardware limits.

## Test

```bash
pytest -q simulator/circuit-simulator/tests
```

Future work should add event scheduling, sequential devices, virtual clock/trigger behavior, Circuit Graph execution and virtual capture while keeping the same application-level contracts used by Physical Hardware.
