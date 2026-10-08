import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from netcircuit_sim.logic import and2
from netcircuit_sim.circuit import evaluate_74hc08_gate
from netcircuit_sim.waveform import DigitalSample, build_waveform


def test_and2_truth_table():
    expected={(0,0):0,(0,1):0,(1,0):0,(1,1):1}
    for inputs, output in expected.items():
        assert and2(*inputs)==output


def test_74hc08_starter_gate_uses_and_logic():
    assert evaluate_74hc08_gate(1,1)==1
    assert evaluate_74hc08_gate(1,0)==0


def test_build_waveform_preserves_order():
    samples=build_waveform([(0,0),(1,1),(2,0)])
    assert samples==[
        DigitalSample(index=0,value=0),
        DigitalSample(index=1,value=1),
        DigitalSample(index=2,value=0),
    ]
