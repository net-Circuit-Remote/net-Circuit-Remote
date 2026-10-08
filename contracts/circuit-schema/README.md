# Circuit Graph Contract

`circuit.schema.json` is the canonical application-level circuit contract. Version `1.0` requires `schema_version`, `circuit_id`, `modules`, and `connections`.

The Circuit Graph describes logical intent only. It must never contain FPGA register addresses, Linux SPI paths, or raw switching-fabric addresses. Hardware translation belongs to the Hardware Service.

Breaking schema changes require a new schema version and consumer updates.
