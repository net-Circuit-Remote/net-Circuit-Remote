# net*CIRCUIT Oscilloscope · 2 channels

`oscilloscope-2ch.glb` is self-contained. `oscilloscope-2ch.gltf` uses the adjacent
`oscilloscope-2ch.bin`, `screen.png`, `legends.png` and `owl.png`; retain those files
together. No compression extension or decoder is required. Materials use core PBR
and `KHR_materials_unlit` for the screen/printed decals.

The same `src/three/OscilloscopeModel.ts` factory supplies the workspace model.
Choose **Instruments → Oscilloscope · 2 channels**, then click the surface or drag
from the palette. Selection, Move-only body dragging, X/Z and Y gizmo transforms,
Undo/Redo and circuit JSON persistence use the existing editor commands.

## Coordinate contract

- Root: `net_circuit_oscilloscope_2ch`; translation/rotation zero, scale `[1,1,1]`.
- Origin at the center of the enclosure base on the work surface; Y up, front +Z.
- Catalog size: `[6,3.8,2.8]` **editor world units**, consistent with workspace
  models. These are visual dimensions, not measurements in meters or device ratings.
- 15,602 triangles, 76 meshes, 7 knob pivots, exactly two channel BNC connectors.
  GLB is approximately 1.14 MB. Shared materials, merged vents/flutes/fasteners,
  1024×704 screen, 1536×960 transparent legends and a 64×64 supplied owl decal.

## Named objects

| Object | Contract |
|---|---|
| `screen` | Independent front plane, unlit material; waveform texture slot |
| `time_div_knob`, `horizontal_position` | Horizontal knob pivot groups |
| `trigger_level` | Trigger knob pivot group |
| `ch1_volts_div`, `ch1_position` | CH1 knob pivot groups |
| `ch2_volts_div`, `ch2_position` | CH2 knob pivot groups |
| `run_stop_button`, `auto_set_button`, `single_button` | Independent button meshes |
| `trigger_source_button`, `trigger_mode_button`, `trigger_slope_button` | Independent trigger button meshes |
| `ch1_bnc`, `ch2_bnc` | Separate connector assemblies, channel-colored rings |
| `brand_owl`, `front_legends` | Owl and original net*CIRCUIT panel legends |

Each knob group has its own center pivot; rotate its local **Z** to turn its body,
flutes, cap and index together. Rotate the instrument root about **Y** to orient
it on the bench. Button press direction is local Z. Interactive scene picking
continues to select the complete module; controls are prepared for later wiring.

The initial yellow square trace and cyan sine trace are **illustrative previews**.
No acquisition, sample rate, bandwidth, physical pinout or working button behavior
is implied. The visual-only catalog entry creates no logical electrical ports.

For a GLTFLoader-imported screen, assign a reused CanvasTexture with
`colorSpace = SRGBColorSpace` and `flipY = false` (glTF image-top UV convention).
Set `texture.needsUpdate = true` after repainting; dispose the replaced texture
once. The procedural workspace factory already provides a CanvasTexture using
the normal Three.js `flipY = true` convention. Neither requires geometry rebuilds.

## Regenerate and inspect

From `apps/web`, after `npm ci` (`sharp` is a development dependency):

```text
npm run export:oscilloscope
```

If sharp is installed elsewhere, use
`npm run export:oscilloscope -- --sharp-module /absolute/path/to/sharp`.
The script exports geometry through Three's GLTFExporter and rasterizes the same
shared drawing recipe used by the live CanvasTextures. It also regenerates the
original SVG palette preview. No external image service or model download is used.

Run `npm test` for names, pivots, geometry budget, catalog/graph/gizmo integration,
GLB buffer/PNG validation and GLTFLoader round trips. For development WebGL
inspection, run Vite and open `/oscilloscope-preview.html`: it loads the delivered
GLB directly and provides a CanvasTexture replacement test. This standalone asset
viewer adds no navigation to the single workspace application.
