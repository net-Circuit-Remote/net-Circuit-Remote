# FPGA Transport Packet Format — Placeholder

The physical transport and packet layout are intentionally not frozen. A future packet is expected to identify command/address, payload length, payload and status/error information; CRC/checksum will be evaluated when the SPI transport is implemented.

No Browser or frontend code may consume this protocol directly.
