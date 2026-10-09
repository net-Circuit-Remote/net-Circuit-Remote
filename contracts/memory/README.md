# Local Memory Image 1.0

`memory-image.schema.json` defines the editor's local initial byte image. A generic MEMORY module stores it in `properties.memory`:

```json
{"version":"1.0","word_bits":8,"depth":4,"data":[0,1,65,255]}
```

Depth is 1–256; bytes are integers 0–255. Consumers additionally require `data.length === depth` (JSON Schema cannot express this equality). Browser parsing enforces both constraints before graph mutation. New instances explicitly initialize 32 zero bytes; this is local configuration, not a physical RAM read or simulated capture. Instances own independent arrays. Hex Editor can apply space-separated two-digit bytes, load/save image JSON, and undo/redo through circuit history.

ADDR/DATA_IN/DATA_OUT/WE/OE/CLK are functional editor ports, not a chosen chip's pins. The simulator must later define addressing, write/read timing, reset and persistence semantics before execution. This contract does not describe V1 SDRAM hardware or a selected memory part.
