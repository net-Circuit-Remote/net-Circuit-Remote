# Phase 2 — Interactive Circuit Workspace

User-authorized implementation, 2026-10-09. Extends the Single Workspace shell without new routes or execution APIs.

## Boundaries

Circuit Graph is the source of logical identity. Component IDs and named functional ports define connections. World position (x/y/z) and rotation in degrees are presentation only. Snapping, overlap and decorative breadboard holes never create nets. Structure and power-supply visuals have no electrical ports. Logical 74HC08 gates do not imply a package pin map or confirmed voltage limits.

The canonical editor catalog in device-library defines types, port directions, default properties and visual styles. Browser consumes a generated, verified snapshot. Arithmetic types are generic Adder and Multiplier abstractions, without unconfirmed part numbers. Generic memory uses a separately versioned local byte-image contract, independent of physical RAM or acquisition.

## Interaction and history

Ribbon drag/drop or click then canvas click places a module. Select, Move, Rotate, Delete and Wire operate on explicit IDs. Wire connects named functional ports; Inspector offers keyboard equivalents and disconnect. Move previews geometry during a captured pointer gesture and commits exactly once on release. Escape/cancel restores graph geometry. Every committed graph mutation invalidates prior API validation and enters bounded undo/redo history; failed/no-op changes do neither. Delete cascades incident connections.

Current navigation correction (2026-10-09, latest user rule): left drag empty surface pans XZ; only Move permits direct model dragging, while Select only selects. Right drag orbits, middle drag also pans, wheel zooms. XYZ follows camera orientation; six adjacent orbit/pan buttons replace the View controls box. Model dragging preserves Y and uses the picked surface's horizontal plane even near a low camera. Controls also expose zoom/reset and snap. Imported unknown modules/ports remain in the graph with fallback visuals and cannot silently acquire fabricated pin maps. Import rejects duplicate IDs and dangling module references. See `docs/SOURCE_ANALYSIS_WORKSPACE_NAVIGATION.md` for the algorithm and current evidence.

## Graphics lifecycle

Current selection/Info refinement (2026-10-09): thin yellow contours follow actual geometry without recoloring the body or surrounding it with a box cage. Breadboard housing has recessed channels and integrated joints, retaining visual contact counts and canonical docking dimensions. Generic curved silhouette edges update with the camera through the existing render callback. One anchored upper-right Component Info panel replaces the selection action card and metadata-heavy window; it shows supplied artwork, name, introduction and Add +. Automatic selection does not take canvas focus/capture. Add only arms supported placement; a surface click commits the existing graph command. Other instrument/Inspector/Hex windows remain movable. See `docs/SOURCE_ANALYSIS_SELECTION_AND_COMPONENT_INFO.md`.

SceneManager owns camera, lights, work surface, models, wires, picking and resource disposal. Vue bridges pointer/drag/resize/visibility/context lifecycle. OrbitControls listeners and requestAnimationFrame are disposed on unmount. GPU/context failures retain Inspector/file access to the logical graph. Rendering stays outside Pinia.

## Verification

Behavior tests cover graph edits/history, rejected connections, cascade deletion, metadata provenance, memory isolation/validation, scene reconciliation, picking/anchors and cancellation/disposal. Build, frontend boundaries, repository checks and actual browser gestures verify integration. No simulation waveform, real power supply or physical routing claim is introduced.
