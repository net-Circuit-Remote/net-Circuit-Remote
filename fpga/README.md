# FPGA Workspace

This directory holds the future RTL and Quartus project sources for net*CIRCUIT Remote.

## Targets

- **Prototype:** EP4CE6E22C8N, no external SDRAM, Experiment Controller only.
- **V1 final:** EP4CE10E22C8N + 64 MB 16-bit SDR SDRAM.

The RTL should be modular and portable between the prototype and final target where practical. Target-specific pin assignments and timing constraints must remain separate from reusable RTL.

No file in this scaffold claims that routing, Logic Analyzer, SDRAM, Generator, or Oscilloscope functionality is already implemented.
