# Device Library

Declarative metadata for virtual and physical devices.

This folder deliberately separates logical identity from unverified electrical values. Datasheet-derived voltage, timing, package and pin information should only be added for exact selected components and should include source/revision notes in future hardware phases.

## Phase 2 functional editor catalog

`editor/components.json` is the canonical metadata for 17 placeable editor types: structural visuals, passives, digital inputs/outputs, 74HC08 gates, generic arithmetic and memory. Render styles/dimensions are arbitrary presentation units. Named functional ports define editor connections; they do not establish package pins, voltage/timing ratings or hardware capabilities. The 74HC08 entry references existing starter device metadata; its A1/B1/Y1…A4/B4/Y4 ports are logical gates. Adder/Multiplier deliberately have no part number. Memory references the separate local `memory-image/1.0` contract.

Breadboard, board and power supply visuals have no ports. Decorative contacts never imply the unconfirmed breadboard node map or a real source.

Run `python scripts/sync_editor_catalog.py` after changing canonical editor definitions, and commit the generated `apps/web/src/data/editorCatalog.json`. Frontend tests verify exact provenance. Catalog availability means placement/configuration is supported; execution support is a later contract.
