# Deployment Templates

This directory contains **starter templates**, not a production-hardening claim.

- `nginx/netcircuit.conf`: serves the built Vue SPA and proxies `/api/` and `/ws/` to FastAPI.
- `systemd/netcircuit-api.service`: runs FastAPI on localhost port 8000.
- `systemd/netcircuit-hardware.service`: runs the Hardware Service on localhost port 50051.
- `raspberry-pi/README.md`: deployment checklist for Raspberry Pi OS 64-bit.

The Hardware Service must not be exposed directly to the public network. Browser traffic goes through the Application Backend.
