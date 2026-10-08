from .logic import and2


def evaluate_74hc08_gate(a: int, b: int) -> int:
    """Starter functional model for one 74HC08 two-input AND gate."""
    return and2(a, b)
