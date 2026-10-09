# Ribbon, gizmo and upright supply refinement

The latest user request authorizes implementation in the existing checkout. Reference images guide proportions and controls; their numeric readouts do not authorize fabricated electrical telemetry.

- [x] Remove ribbon Info rows; anchor the palette to its triggering family, clamp to the visible ribbon, update on scroll/resize, retain keyboard focus and outside/Escape dismissal. Keep every family label on one line.
- [x] Reproduce the frozen Y grip with a regression test. Increase gizmo contrast and stroke width; rotate its arc/grip with object yaw while keeping X/Z constraints in world space. Preserve picking, camera-relative size, cancellation and one Undo per gesture.
- [x] Replace the squat supply with an upright metal enclosure, vertical V/A/W screen, two Voltage/Ampe knobs, two Vcc/Gnd sockets and an I/O switch. No USB; no electrical ports or claimed measured values. Update the canonical visual dimensions and synchronize the browser catalog.
- [x] Run frontend tests, production type checking, the permitted build, static frontend/docs/context checks and native browser verification. Review the complete diff and update current Markdown documentation with actual evidence and limitations. Production bundling remains unverified due to the documented sandbox restriction.

Ruling: Direct body dragging remains restricted to Move; explicit gizmo manipulation is available when a model is selected. The screen uses bright unknown-value placeholders and OUTPUT OFF, since the supply still has a visual-only contract.

Ruling: Production bundling is attempted only within the sandbox. An earlier escalation was rejected by the user, so this task will not repeat or bypass that request.

Ruling: Taller geometry requires projected selected-model clearance. Cache unposed bounds and project them through current pose, rather than inflating a world AABB after yaw; prioritize viewport clearance when screen space is tight. A small-canvas rotation regression reproduced the clipped arc and now passes.

Review fix: The read-only reviewer found closed terminal caps blocking socket depth. A center-ray test reproduced the cap; open cylinders/annular flanges now expose the recessed dark floors. Final npm suite: 82/82 PASS. Native browser: Y 0→120° with one Undo/Redo, X 0→1 preserving Y/Z, free XZ (0,0)→(0.5,0.5), five responsive palette measurements and no fresh warning/error logs. See the verification report for final static/build limitations.

Final checks: UTF-8 frontend/docs/context tests 17/17 PASS; context check and diff whitespace PASS. Final production TypeScript PASS; Vite sandbox realpath EPERM prevents bundling. No hosted CI run or commit/push/deployment. All changes remain reviewable in the shared checkout.
