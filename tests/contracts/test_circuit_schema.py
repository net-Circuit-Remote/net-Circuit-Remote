import json
from pathlib import Path
import pytest
from jsonschema import Draft202012Validator, RefResolver, ValidationError

ROOT=Path(__file__).resolve().parents[2]
SCHEMA_DIR=ROOT/'contracts/circuit-schema'


def load(name):
    return json.loads((SCHEMA_DIR/name).read_text())


def validator():
    circuit=load('circuit.schema.json')
    store={
        'module.schema.json': load('module.schema.json'),
        'connection.schema.json': load('connection.schema.json'),
    }
    return Draft202012Validator(circuit, resolver=RefResolver.from_schema(circuit, store=store))


def valid_graph():
    return {
        'schema_version':'1.0',
        'circuit_id':'exp-001',
        'modules':[{'id':'SW1','type':'DIGITAL_SWITCH'},{'id':'U1','type':'74HC08'}],
        'connections':[{'source':'SW1.OUT','destination':'U1.1'}],
    }


def test_valid_graph_is_accepted():
    validator().validate(valid_graph())


def test_missing_schema_version_is_rejected():
    graph=valid_graph(); graph.pop('schema_version')
    with pytest.raises(ValidationError): validator().validate(graph)


def test_module_requires_id_and_type():
    graph=valid_graph(); graph['modules']=[{'id':'U1'}]
    with pytest.raises(ValidationError): validator().validate(graph)


def test_connection_requires_source_and_destination():
    graph=valid_graph(); graph['connections']=[{'source':'SW1.OUT'}]
    with pytest.raises(ValidationError): validator().validate(graph)
