# Application Backend

FastAPI shell for net*CIRCUIT Remote.

## Local run

```bash
cd services/api
python -m venv .venv
. .venv/bin/activate
pip install -e '.[test]'
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Current endpoints:

- `GET /api/health`
- `POST /api/circuits/validate`
- `GET /api/stations`
- `WS /ws/events`

This layer validates application intent. It does not write FPGA registers directly.
