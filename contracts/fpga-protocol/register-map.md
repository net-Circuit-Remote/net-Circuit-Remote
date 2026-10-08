# FPGA Register Map — Reserved Structure

**Status:** placeholder. Addresses below are conceptual groups, not a frozen hardware ABI.

Planned groups:

- DEVICE_ID / FPGA_VERSION
- PROTOCOL_VERSION / REGISTER_MAP_VERSION
- STATUS / CONTROL
- CLOCK_CONFIG / CLOCK_STATUS
- ROUTE_CONTROL / ROUTE_STATUS
- TRIGGER_CONFIG / TRIGGER_STATUS
- CAPTURE_CONFIG / CAPTURE_STATUS
- SDRAM_STATUS (EP4CE10 V1)
- ERROR_STATUS / ERROR_CLEAR

The final map must be versioned and implemented identically in RTL, Hardware Service, tests and documentation.
