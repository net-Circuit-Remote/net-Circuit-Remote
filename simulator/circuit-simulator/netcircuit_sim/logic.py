def _logic_level(value: int) -> int:
    if value not in (0, 1):
        raise ValueError(f"digital logic level must be 0 or 1, got {value!r}")
    return value


def and2(a: int, b: int) -> int:
    """Two-input deterministic digital AND primitive."""
    return _logic_level(a) & _logic_level(b)
