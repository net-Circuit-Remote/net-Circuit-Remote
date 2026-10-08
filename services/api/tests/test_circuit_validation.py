import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient
from app.main import app

client=TestClient(app)

def valid_graph():
    return {'schema_version':'1.0','circuit_id':'c1','modules':[{'id':'SW1','type':'DIGITAL_SWITCH'}],'connections':[]}

def test_valid_circuit_returns_structured_success():
    response=client.post('/api/circuits/validate',json=valid_graph())
    assert response.status_code==200
    assert response.json()=={'valid':True,'code':'OK','message':'Circuit Graph is structurally valid.'}

def test_missing_schema_version_returns_structured_error():
    graph=valid_graph(); graph.pop('schema_version')
    response=client.post('/api/circuits/validate',json=graph)
    assert response.status_code==422
    body=response.json()
    assert body['valid'] is False
    assert body['code']=='SCHEMA_VALIDATION_ERROR'
    assert body['message']
