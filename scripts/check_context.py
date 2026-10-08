#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
REQUIRED = ["CONTEXT.md", "ARCHITECTURE.md", "ROADMAP.md", "DEV_LOG.md", "CIRCUIT_SPEC.md", "CHANGELOG.md"]
MARKERS = {
    "CONTEXT.md": ["EP4CE6E22C8N", "EP4CE10E22C8N", "64 MB", "Web-first", "Frontend must never"],
    "DEV_LOG.md": ["current_phase:", "next_task:", "## AI Handoff"],
}

errors = []
for name in REQUIRED:
    if not (DOCS / name).is_file():
        errors.append(f"missing docs/{name}")
for name, markers in MARKERS.items():
    path = DOCS / name
    if path.is_file():
        text = path.read_text(encoding="utf-8")
        for marker in markers:
            if marker not in text:
                errors.append(f"docs/{name} missing marker: {marker}")
if errors:
    for error in errors:
        print(f"context-check: ERROR: {error}")
    sys.exit(1)
print("context-check: PASS")
