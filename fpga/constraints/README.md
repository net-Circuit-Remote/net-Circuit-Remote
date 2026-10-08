# FPGA Constraints

Target-specific Quartus QSF/SDC files will live here.

Planned separation:

```text
constraints/
├── ep4ce6/
└── ep4ce10/
```

Do not assume E144 package equality implies perfect pin migration. Pin migration, bank voltages, dedicated clock pins and timing constraints must be validated in Quartus before PCB decisions are frozen.
