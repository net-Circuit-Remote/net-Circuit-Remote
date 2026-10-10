# Stability audit browser verification — 2026-10-10

Local target: `http://127.0.0.1:5174/`, actual Vite app in the Codex browser, with no test-only scene hooks. DOM/accessible controls and native pointer/wheel actions were used. A new temporary circuit held Breadboard 830, Function Generator and Oscilloscope visuals.

## Observed interactions

1. New, Structure → Breadboard 830, native canvas placement and Escape: Components=1, real perforated housing visible.
2. Zoom In: toolbar reads 110%. Native wheel down: 104.07%. Wheel changes now update the same toolbar state.
3. Instruments → Function Generator and Oscilloscope, native placement/Escape: Components=3; both pitched assemblies render with authored screen/legend textures.
4. Fit: 100%. Three Orbit-left clicks change camera heading; native left drag on empty surface pans the view. Native wheel up reports 113.8%. Graph component count remains 3.
5. Portrait 720×1000: shapes retain proportions; Fit frames the models and resets zoom to 100%. Ribbon scrolls horizontally and status controls remain available.
6. Landscape 1280×720 after final fixes: Fit and Zoom In report 110%, models and selected contours render normally. Temporary viewport override was reset after capture.

## Canvas sizing evidence

| Viewport | CSS canvas | Drawing buffer | Buffer/CSS X | Buffer/CSS Y |
| --- | --- | --- | --- | --- |
| 720×1000 | 654×774 | 817×967 | 1.249235 | 1.249354 |
| 1280×720 | 1214×533.200012 | 1214×533 | 1 | 0.999625 |

Differences are fractional-pixel buffer rounding; no CSS scale transform was applied. Complementary numeric navigation tests project a camera-facing square and verify equal X/Y pixel dimensions, unchanged model matrices/root scale and uniform gizmo scale.

Collected final browser warning/error logs: `[]`. There was no running API in this browser session, so the visible reconnecting discovery state is expected. Backend/WebSocket paths were checked separately through the automated suites. No claim is made about real browser GPU heap retention or physical hardware behavior.

Final screenshot: `C:/Users/trann/.codex/visualizations/2026/10/10/01a124e7-33d2-74e2-ae75-2e568806ce77/stability-navigation.png`.

Source audit and full verification boundaries: `../SOURCE_ANALYSIS_STABILITY_AUDIT.md`.
