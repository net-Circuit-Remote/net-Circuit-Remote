import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient
from app.main import app

client=TestClient(app)

def test_health_endpoint_reports_ok_and_simulation_mode():
    response=client.get('/api/health')
    assert response.status_code==200
    body=response.json()
    assert body['status']=='ok'
    assert body['hardware_mode']=='simulation'
