# Phase 2 implementation plan

Status: IMPLEMENTED; current verification in DEV_LOG and Phase 2 browser report. Executed within the user-approved scope in the current checkout.

1. Read graph/schema, simulator, metadata, stores, scene and shell; identify unconfirmed device/electrical contracts.
2. Add canonical editor catalog, generated browser snapshot and versioned memory contract. Add failing behavior tests, then implement typed graph commands and import integrity.
3. Add metadata-backed Three.js models, named port anchors, wires, picking, lighting, orbit/pan and deterministic lifecycle. Test reconciliation and disposal.
4. Bridge palette drag/drop, placement, select/move/rotate/delete, wire/unwire, snap and keyboard access. Integrate selected-component Inspector and local memory Hex Editor.
5. Run npm tests/build, Python contract/boundary checks and browser scenarios at desktop sizes. Resolve observed failures with regression tests.
6. Obtain a fresh read-only final review, fix verified findings, update current Markdown, analysis and browser evidence.

No commit, merge or deployment is requested. Execution/acquisition and physical topology remain future contracts.

## Execution ledger

1. Source/contracts reviewed; Phase 1 shells had no graph editing/scene models and canonical metadata had no physical pin map.
2. Graph/catalog/memory tests RED missing APIs → GREEN; import integrity and separate contracts implemented.
3. Scene reconciliation/anchors/picking tests RED → GREEN; models/lights/wires/orbit/lifecycle implemented.
4. Native browser interactions verified placement/drag/move/wiring/history/Inspector/Hex Editor and JSON round trip.
5. Final read-only review identified instance-buffer disposal and Escape focus paths; both RED reproduced and fixed. Ghost reuse has regression coverage.
6. Keyboard view controls added for accessible camera operations; tests RED missing interfaces → GREEN. Desktop responsive/window bounds and API/events verified. Current docs reflect Phase 2; final test/build evidence is in DEV_LOG/report.
7. Wire picking margin reproduced RED; invisible pixel-scaled target fixed pointer precision. Browser direct Delete/Undo verified. Final npm 43/43, build PASS, Python 56/56 and context check PASS; screenshot and downloaded graph retained in verification artifacts.

Ruling: preserve session-local drafts/graph schema 1.0 and the user's existing checkout/icons/axis art; no speculative simulation/physical topology or additional navigation. Demand rendering is sufficient for non-animated models; Phase 3 bears event/model/execution integration cost.
