from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]


def test_context_and_circuit_spec_agree_on_fpga_and_memory():
    context=(ROOT/'docs/CONTEXT.md').read_text(encoding='utf-8')
    spec=(ROOT/'docs/CIRCUIT_SPEC.md').read_text(encoding='utf-8')
    for marker in ['EP4CE6E22C8N','EP4CE10E22C8N','64 MB','16-bit']:
        assert marker in context
        assert marker in spec


def test_roadmap_defines_web_first_gate_before_ep4ce6():
    roadmap=(ROOT/'docs/ROADMAP.md').read_text(encoding='utf-8')
    assert roadmap.index('Milestone W1') < roadmap.index('Phase 8 — EP4CE6')


def test_design_spec_and_plan_are_preserved():
    assert (ROOT/'docs/superpowers/specs/2026-10-08-net-circuit-remote-architecture-design.md').is_file()
    assert (ROOT/'docs/superpowers/plans/2026-10-08-initial-repository-scaffold.md').is_file()
