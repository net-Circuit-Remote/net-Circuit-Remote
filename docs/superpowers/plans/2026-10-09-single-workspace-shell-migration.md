# Single Workspace Shell Migration — implementation plan

Date: 2026-10-09. Approved specification: `../specs/2026-10-09-single-workspace-ui-design.md` and the user's Phase 1 checklist. Execution: inline, in the existing user-selected checkout. Preserve existing documentation edits and transport contracts. No commit/push is requested.

## Tasks

- [x] 1. Analyze source and asset provenance. Generate small SVG thumbnails from the PNGs embedded in `assets/icon .svg`, preserving the originals. Document the reusable boundaries and current backend capabilities.
- [x] 2. RED → GREEN state and file tests: single active tool; shared window open/close/focus/bounds; local JSON import/export; bounded undo/redo; malformed imports leave the current circuit intact; legacy/unknown URLs normalize to `/`.
- [x] 3. RED → GREEN Three.js lifecycle test: resize/render coalescing, zero-size handling, resource disposal and cancellation. Keep renderer ownership outside Pinia and logical graph state.
- [x] 4. Replace the shell with App/File Bar, twelve ribbon groups, seven tools, dominant workspace, status bar and six shared floating-window bodies. Delete unused page/sidebar/dock components after replacing their references. Retain API, WebSocket, station selection and graph validation in contextual Inspector.
- [x] 5. Verify npm test/build, frontend boundary checks and suitable full regression. Browser-check 1920×1080, 1440×900, 1366×768, 1280×720; file actions, ribbon, windows, keyboard, resize and legacy redirects. Request one independent final code review and resolve material findings.
- [x] 6. Update README, architecture, context, roadmap, development log, changelog, docs manifest and the approved spec with implementation status, exact evidence and Phase 2 limits.

## Shared interfaces

`workspace`: tool enum select/wire/move/rotate/delete/scope/probe, preview ID, zoom.
`ui`: activeRibbonGroup, connectionState, bounded viewport and a maximum of one window per kind (oscilloscope/generator/monitor/component-info/inspector/hex-editor). Window positions are workspace-relative; move/focus/reflow are centralized.
`circuit`: retained session drafts and backend validation plus importGraph, exportGraph, undo, redo and saved snapshots. Input remains schema v1 JSON, never renderer objects.
`SceneManager`: owns scene/camera/grid/renderer; host bridge owns observer, scheduled frames and disposal. Vue creates once on mount and disposes on unmount.

## Review Focus

- Imported malformed/oversized JSON must not replace a working circuit or poison undo history.
- Switching draft, undo/redo and pending validation must never apply stale approval.
- Dragging, reopening and shrinking the viewport must leave floating-window controls reachable.
- Offline API/WebSocket and missing simulation contracts must expose honest states, with no fabricated waveforms or execution.
- Original embedded-raster SVGs must never enter the production bundle; scene disposal must cancel scheduled work.

## Execution evidence

Baseline: npm test 20/20 PASS outside the restricted Windows sandbox (loopback HTTP is blocked inside it). Evidence for each task is appended here during execution.

Scope decisions: exact twelve groups from the user's checklist; no additional Interaction group. Local project commands and history support Phase 1 file actions; placement/wiring and simulation execution remain Phase 2+. Run/Step and instrument output stay explicitly unavailable until their contracts exist. Router only normalizes addresses; App renders one shell directly.

Task 1 complete: 17 generated SVGs, 101,749,162 → 43,482 bytes; originals verified by SHA-256; canonical metadata snapshots covered by Python checks.

Tasks 2–4 complete: interface/lifecycle tests observed RED before implementation; integrated runtime suite GREEN 28/28. Obsolete pages and permanent panels removed. Root renders one shell, retaining live connection/validation/discovery.

Task 5 complete: one independent read-only review identified two material issues. Final fix pass: repeated activation/focus loss and export/import size mismatch each reproduced RED (browser and runtime); fixes GREEN, npm test 31/31. Production build PASS; frontend checks 9/9; full regression 44/44; browser layout/interaction PASS at all four requested desktop sizes. Vite's advisory about the application/Three.js chunk remains non-blocking.

Task 6 complete: current Markdown status, source analysis, API consumers, roadmap/handoff and browser evidence updated. No source integration commit/push requested or performed. Existing superseded specs/plans retain historical architecture context.

Final review scope decisions: editing/execution/capture remain explicitly deferred by the approved shell spec (cost: future model/editor/API work). The no-op route component serves typed address compatibility without workflow ownership (cost: temporary router dependency). Permissive module properties match the canonical schema (cost: logical/electrical validation still belongs to the API). Documentation was completed after the review; no unresolved material findings or reviewer-deferred minors remain.
