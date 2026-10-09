# Component Transform Gizmo Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan inline. Steps use checkbox tracking.

**Goal:** Provide adjacent X/Z movement and Y rotation handles, defined status-bar viewport tools, and a professional visual bench power supply.

**Architecture:** SceneManager owns one reusable render/pick gizmo. useCircuitEditor owns captured transform preview/cancel/commit, using circuit commands for one history step. Status tools issue store view requests; the scene fits full circuit bounds. PowerSupplyModel owns visual geometry only.

**Tech Stack:** Existing Vue 3/Pinia/TypeScript/Three.js; no new dependencies.

**Spec:** User request dated 2026-10-09: remove Perspective overlay, put Zoom In/Out/Fit and Workspace Object Snap at status-bar right, add adjacent X/Z/Y gizmo with hover/live preview/stable camera scale, no Delete/Confirm/Check, remove tool-title hint, improve Power Supply using supplied photo as inspiration.

## Constraints / review focus

- Direct body dragging still requires Move; explicit gizmo handles manipulate the selected model.
- Preview changes no graph/history. Release commits once; Escape/pointer cancel/tool/selection/graph/context changes restore committed pose and release capture.
- Preserve module IDs, Y elevation, named ports/wires, validation/history and scene disposal.
- Gizmo avoids selected/nearby housing, remains stable in pixel scale, and never becomes a circuit object or electrical endpoint.
- Power supply remains visual-only; decorative terminals/readouts must not claim physical power or fabricated live measurements.
- Respect the user's prior decline of outside-sandbox build; record any sandbox build limitation accurately.

## Tasks

1. [x] Write/run failing tests for fit bounds, gizmo hover/picking/scale/following/disposal, constrained move/rotation/live wires/one Undo/cancel, and supply visual geometry.
2. [x] Add `three/ComponentTransformGizmo.ts`; integrate render update and explicit picking in `SceneManager.ts`. Add fitCircuit and previewRotation.
3. [x] Extend `useCircuitEditor.ts` with transform gestures; reuse snap and existing graph move/rotation commands. Keep Move-only body gestures and pan/orbit.
4. [x] Move viewport controls to `SimulationStatusBar.vue`, define tools with accessible names/descriptions, route fit through workspace store. Remove Perspective and generic tool hint in `CircuitWorkspace3D.vue` and CSS.
5. [x] Add `three/PowerSupplyModel.ts` and integrate it in ComponentModel; retain catalog dimensions/ports. Use original casing/controls/vent design, blank OFF readouts and decorative output terminals.
6. [x] Run final npm suite/type checks, attempt permitted build, verify native browser interactions/responsive status toolbar, capture screenshots; review changes and update README/context/architecture/dev log/spec/evidence.

No commit/push or deployment is part of this request.

## Execution evidence

Tasks 1–5 implemented; final npm 79/79 PASS (11 new regressions), UTF-8 Python frontend/docs/context 17/17 PASS, context/diff checks PASS. Native browser supply X/Y-arc and breadboard free handle plus one Undo verified; four viewport sizes and fresh-load console checked. Fresh review found neighbor iterator/active scale P2 bugs, both reproduced RED and corrected GREEN. Added window/navigator exclusions and retained Move-only body gestures.

Task 6 checks executed and documentation/screenshots updated. Production TypeScript passes; Vite bundling remains NOT VERIFIED because sandbox realpath EPERM and prior build elevation decline. No commit/push/dependency/contract changes. Ledger retained for handoff; build acceptance remains pending a permitted normal environment.
