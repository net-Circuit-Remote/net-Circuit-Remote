from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
FPGA=ROOT/'fpga'


def test_fpga_workspace_has_expected_boundaries():
    required=[
        'README.md','common/README.md','experiment-controller/README.md',
        'experiment-controller/rtl/top.v','instrument/README.md','simulation/README.md',
        'constraints/README.md','quartus/README.md'
    ]
    missing=[p for p in required if not (FPGA/p).is_file()]
    assert not missing, missing


def test_experiment_controller_docs_name_both_targets_and_no_sdram_prototype():
    text=(FPGA/'experiment-controller/README.md').read_text()
    for marker in ['EP4CE6E22C8N','EP4CE10E22C8N','no external SDRAM']:
        assert marker in text


def test_top_is_explicit_placeholder_not_feature_claim():
    text=(FPGA/'experiment-controller/rtl/top.v').read_text().lower()
    assert 'placeholder' in text
    assert 'module netcircuit_experiment_top' in text
    assert 'sdram controller implemented' not in text
