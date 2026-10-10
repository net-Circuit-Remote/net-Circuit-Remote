# Project stability audit implementation plan

> **For agentic workers:** Use superpowers:executing-plans for the scene changes and dispatching-parallel-agents for independent source audits. Each verified defect gets a failing regression before its fix.

**Goal:** Correct reproduced crashes, resource leaks, stale state and avoidable interaction costs, with particular attention to Pan/Rotate/Zoom and uniform visual scale.

**Architecture:** Keep the approved Single Workspace and graph contracts. Circuit Graph remains the logical source; Three.js objects remain disposable projections. Inspect the frontend, API, hardware service, simulator, contracts, FPGA scaffold and deployment helpers; distinguish runnable implementations from placeholders.

**Tech Stack:** Vue/Pinia/TypeScript/Three.js, FastAPI/Pydantic, Python gRPC and simulator.

**Spec:** User audit request; docs/CONTEXT.md; docs/ARCHITECTURE.md; approved Single Workspace design.

## Global constraints

- Keep the hardware boundary and canonical schema; do not implement missing hardware or simulation features.
- Preserve the instrument chassis pitch, textures, object names and interaction pivots.
- Navigation must never scale or change model/graph poses.
- Run meaningful regression tests, production build and actual browser interaction checks.
- Preserve existing changes; no commit, push or deployment requested.

## Review focus

- Wheel and toolbar zoom must share a metric, update the UI and round trip without pose changes.
- Non-finite inputs and hidden/zero-size viewports must not poison the camera.
- Moving one module must preserve unrelated wire buffers, materials and selected-wire color.
- Removed models must not receive late texture callbacks; shared resources must have correct ownership.
- Aborted REST requests, newer WebSocket events and malformed backend input must not corrupt state or crash.

## Task 1: Scene navigation and reconciliation

**Files:** SceneManager.ts, CircuitWorkspace3D.vue, useCircuitEditor.ts; camera-navigation.test.ts and scene-reconciliation.test.ts.

- [x] Reproduce split wheel/toolbar zoom, non-finite camera input, all-wire recreation and post-disposal ghost creation in regression tests.
- [x] Keep perspective FOV and camera zoom fixed; use target-relative dolly for both zoom inputs, publish zoom percentage and reset the reference after Fit/Reset.
- [x] Reconcile wires by endpoint pair; index modules and incident connections; rebuild geometry only when endpoints change, preserving material and selection.
- [x] Retain the same-type supply assembly during setting commits, using its existing in-place visual update.
- [x] Guard disposed and invalid-input paths; clean a partially initialized scene on failure.
- [x] Move docking distance rejection before expensive collision tests; cache board footprints per operation.
- [x] Run scoped scene/interaction tests and inspect camera/navigation behavior in a browser.

## Task 2: GPU resource ownership

**Files:** ComponentModel.ts and instrument artwork/loading helpers; resource-lifecycle.test.ts.

- [x] Reproduce shared-resource repeat disposal, globally shared Sprite geometry disposal and late texture callbacks.
- [x] Dispose unique owned resources once; make label geometry owned; release pending-image handlers and stop late callbacks after removal.
- [x] Verify factory/GLB/glTF/chassis regressions. Regenerate exports only if visual geometry changes.

## Task 3: Frontend asynchronous state and memory

**Files:** API client, station/circuit/workspace stores and their tests.

- [x] Reproduce cancellation during body parsing, stale discovery overwrites and event-only station loss.
- [x] Preserve event revisions and request cancellation without changing transport contracts.
- [x] Bound combined Undo/Redo snapshot storage, preserve recent history and prune unreachable saved-state fingerprints.
- [x] Verify finite zoom input and existing editor/store/WebSocket behavior.

## Task 4: Backend and simulator boundaries

**Files:** services/api, services/hardware-service, simulator/circuit-simulator and subsystem tests.

- [x] Reproduce schema drift, malformed WebSocket frames, non-integer simulator inputs, incorrect hardware result flags and missing gRPC shutdown cleanup.
- [x] Make minimal fixes respecting the canonical schema and current driver protocols.
- [x] Run subsystem tests and the whole Python test suite; inspect FPGA/deployment scaffolds read-only.

## Task 5: Integration, review and evidence

- [x] Run all frontend tests, production build, all Python tests and git diff --check.
- [x] Independently review the final changes and resolve material findings.
- [x] Record algorithm/source inventory, defects, evidence and untested boundaries in docs; update DEV_LOG.

## Execution result

Completed on 2026-10-10. Frontend153/153 PASS, production build PASS, Python96PASS/1FAIL (user-owned concurrent icon provenance edit, preserved by explicit instruction). Independent review findings were reproduced/fixed/rechecked. See docs/SOURCE_ANALYSIS_STABILITY_AUDIT.md for evidence and remaining verification boundaries. No commit/push/deployment.
