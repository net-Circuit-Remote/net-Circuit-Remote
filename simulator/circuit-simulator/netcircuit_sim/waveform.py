from dataclasses import dataclass

@dataclass(frozen=True)
class DigitalSample:
    index: int
    value: int


def build_waveform(points: list[tuple[int, int]]) -> list[DigitalSample]:
    samples=[]
    for index, value in points:
        if not isinstance(value, int) or value not in (0, 1):
            raise ValueError(f"digital sample must be 0 or 1, got {value!r}")
        samples.append(DigitalSample(index=index, value=value))
    return samples
