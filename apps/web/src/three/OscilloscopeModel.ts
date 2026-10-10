import { BoxGeometry, CanvasTexture, CylinderGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace, TextureLoader, TorusGeometry, type BufferGeometry, type Material } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { CH1_COLOR, CH2_COLOR, drawScopeArtwork, scopeLegendsArtwork, scopeScreenArtwork, type ScopeArtwork } from './OscilloscopeArtwork'

export const OSCILLOSCOPE_SIZE = [6, 3.8, 2.8] as const
export const OSCILLOSCOPE_KNOBS = ['time_div_knob', 'horizontal_position', 'trigger_level', 'ch1_volts_div', 'ch1_position', 'ch2_volts_div', 'ch2_position'] as const

function canvasTexture(artwork: ScopeArtwork): CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas'); canvas.width = artwork.width; canvas.height = artwork.height
  const ctx = canvas.getContext('2d'); if (!ctx) return null
  drawScopeArtwork(ctx, artwork)
  const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; texture.anisotropy = 4
  return texture
}

// Same factory is used by workspace and GLB/glTF export. Origin: center of the
// enclosure base, Y up, front +Z, unit scale. Dimensions are editor world units.
// Named pivot groups are interaction-ready; acquisition/control behavior is a
// separate contract. They deliberately do not masquerade as supply controls.
export function addOscilloscopeModel(group: Group) {
  const standard = (name: string, color: string, metalness = 0, roughness = 0.5) => {
    const material = new MeshStandardMaterial({ color, metalness, roughness }); material.name = name; return material
  }
  const shell = standard('scope_graphite_metal', '#343e47', 0.42, 0.42)
  const bezel = standard('scope_bezel', '#161e25', 0.2, 0.42)
  const panel = standard('scope_control_panels', '#25313a', 0.16, 0.55)
  const rubber = standard('scope_rubber', '#080f16', 0, 0.7)
  const grip = standard('scope_knob_grip', '#35434e', 0.18, 0.4)
  const silver = standard('scope_bnc_metal', '#b7c4cf', 0.78, 0.26)
  const ivory = standard('scope_index', '#e1e8ec', 0.05, 0.45)
  const yellow = standard('scope_ch1', CH1_COLOR, 0.15, 0.38)
  const cyan = standard('scope_ch2', CH2_COLOR, 0.15, 0.38)
  const gold = standard('scope_bnc_contact', '#cba669', 0.7, 0.35)
  const add = (name: string, geometry: BufferGeometry, material: Material, x: number, y: number, z: number, parent = group) => {
    const mesh = new Mesh(geometry, material); mesh.name = name; mesh.position.set(x, y, z); parent.add(mesh); return mesh
  }
  const rounded = (name: string, size: [number, number, number], pos: [number, number, number], radius: number, material: Material, selection = false) => {
    const mesh = add(name, new RoundedBoxGeometry(...size, 2, radius), material, ...pos); mesh.userData.selectionSurface = selection; return mesh
  }
  // Lightweight curved edges, opaque metal housing, inset front panels and feet.
  rounded('enclosure', [6, 3.6, 2.1], [0, 1.95, 0], 0.085, shell, true)
  rounded('front_bezel', [5.96, 3.55, 0.12], [0, 1.95, 1.015], 0.065, bezel, true)
  rounded('screen_recess', [3.69, 2.73, 0.055], [-0.96, 2.13, 1.09], 0.045, rubber)
  rounded('horizontal_panel', [1.92, 0.97, 0.025], [1.92, 3.10, 1.085], 0.035, panel)
  rounded('trigger_panel', [1.92, 0.65, 0.025], [1.92, 2.275, 1.085], 0.03, panel)
  rounded('vertical_panel', [1.92, 1.5, 0.025], [1.92, 1.185, 1.085], 0.03, panel)
  for (const x of [-2.48, 2.48]) for (const z of [-0.77, 0.77]) {
    const foot = add(`foot_${x}_${z}`, new CylinderGeometry(0.22, 0.24, 0.18, 16), rubber, x, 0.09, z); foot.userData.selectionSurface = true
  }
  // Merge vents and screw heads into two meshes; no per-slot draw call overhead.
  const vents: BufferGeometry[] = [], screws: BufferGeometry[] = []
  for (const x of [-3.002, 3.002]) for (const y of [1.1, 2.2]) for (let i = 0; i < 13; i++) {
    vents.push(new BoxGeometry(0.004, 0.6, 0.04).translate(x, y, -0.70 + i * 0.10))
  }
  for (const x of [-2.78, 2.78]) for (const z of [-0.80, 0.80]) screws.push(new CylinderGeometry(0.045, 0.045, 0.006, 12).translate(x, 3.751, z))
  add('case_vents', mergeGeometries(vents)!, rubber, 0, 0, 0); vents.forEach((g) => g.dispose())
  add('case_fasteners', mergeGeometries(screws)!, silver, 0, 0, 0); screws.forEach((g) => g.dispose())

  // Replace screen.material.map with a CanvasTexture to draw live samples later.
  // Reuse/update that texture rather than allocating one on every acquisition.
  const screenTexture = canvasTexture(scopeScreenArtwork())
  const screenMaterial = new MeshBasicMaterial({ map: screenTexture, color: screenTexture ? '#ffffff' : '#050b10', toneMapped: false }); screenMaterial.name = 'scope_screen'
  const screen = add('screen', new PlaneGeometry(3.45, 2.48), screenMaterial, -0.96, 2.13, 1.122)
  screen.userData = { role: 'waveform-screen', channels: 2, waveform: 'illustrative-preview', textureSize: [1024, 704] }
  const legendsMaterial = new MeshBasicMaterial({ map: canvasTexture(scopeLegendsArtwork()), transparent: true, depthWrite: false, toneMapped: false }); legendsMaterial.name = 'scope_legends'
  const legends = add('front_legends', new PlaneGeometry(6, 3.8), legendsMaterial, 0, 1.9, 1.149)
  legends.userData.ignorePick = true
  // No-texture server/export geometry retains the material slot but not a white
  // opaque decal. The export script supplies this slot with the recipe's PNG.
  if (!legendsMaterial.map) legendsMaterial.opacity = 0
  const logoMaterial = new MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false }); logoMaterial.name = 'scope_brand'
  const owl = add('brand_owl', new PlaneGeometry(0.23, 0.23), logoMaterial, -2.62, 3.63, 1.12); owl.userData.asset = 'favicon.svg'; owl.userData.ignorePick = true
  if (typeof document !== 'undefined' && typeof document.createElementNS === 'function') {
    logoMaterial.map = new TextureLoader().load(new URL('../assets/icons/favicon.svg', import.meta.url).href, () => group.userData.onVisualChange?.())
    logoMaterial.map.colorSpace = SRGBColorSpace
  } else logoMaterial.opacity = 0

  const knob = (name: string, x: number, y: number, radius: number, accent: Material = silver) => {
    add(`${name}_collar`, new TorusGeometry(radius + 0.014, 0.011, 6, 32), accent, x, y, 1.12)
    const pivot = new Group(); pivot.name = name; pivot.position.set(x, y, 1.17)
    pivot.userData = { interaction: 'knob', rotationAxis: 'Z', pivot: 'center' }; group.add(pivot)
    const body = add(`${name}_body`, new CylinderGeometry(radius, radius, 0.14, 24), rubber, 0, 0, 0, pivot); body.rotation.x = Math.PI / 2
    const flutes = Array.from({ length: 24 }, (_, i) => {
      const angle = i * Math.PI / 12
      return new BoxGeometry(0.015, 0.018, 0.11).rotateZ(-angle).translate(Math.sin(angle) * radius, Math.cos(angle) * radius, 0)
    })
    add(`${name}_flutes`, mergeGeometries(flutes)!, grip, 0, 0, 0, pivot); flutes.forEach((g) => g.dispose())
    const cap = add(`${name}_cap`, new CylinderGeometry(radius * 0.88, radius * 0.88, 0.012, 24), bezel, 0, 0, 0.077, pivot); cap.rotation.x = Math.PI / 2
    add(`${name}_index`, new BoxGeometry(0.014, radius * 0.53, 0.004), ivory, 0, radius * 0.46, 0.086, pivot)
  }
  knob('time_div_knob', 1.35, 3.10, 0.23, cyan); knob('horizontal_position', 2.02, 3.10, 0.135)
  knob('trigger_level', 1.35, 2.24, 0.165)
  for (const [channel, x, accent] of [[1, 1.43, yellow], [2, 2.43, cyan]] as const) {
    knob(`ch${channel}_volts_div`, x, 1.35, 0.215, accent); knob(`ch${channel}_position`, x, 0.77, 0.12, accent)
  }
  const button = (name: string, x: number, y: number, width: number, material: Material = grip) => {
    rounded(`${name}_socket`, [width + 0.035, 0.225, 0.035], [x, y, 1.11], 0.025, rubber)
    const mesh = rounded(name, [width, 0.19, 0.04], [x, y, 1.12], 0.025, material)
    mesh.userData = { interaction: 'button', pressAxis: 'Z' }
  }
  button('auto_set_button', 2.60, 3.36, 0.46, cyan)
  button('run_stop_button', 2.60, 3.10, 0.46, standard('scope_run_green', '#36d790', 0.1, 0.4))
  button('single_button', 2.60, 2.84, 0.46)
  button('trigger_source_button', 2.17, 2.32, 0.425); button('trigger_mode_button', 2.66, 2.32, 0.425); button('trigger_slope_button', 2.42, 2.08, 0.45)
  for (const [channel, x, accent] of [[1, -1.40, yellow], [2, -0.18, cyan]] as const) {
    const port = new Group(); port.name = `ch${channel}_bnc`; port.position.set(x, 0.45, 1.12)
    port.userData = { interaction: 'connector', channel, connector: 'BNC', visualOnly: true }; group.add(port)
    add(`ch${channel}_ring`, new TorusGeometry(0.185, 0.025, 8, 32), accent, 0, 0, 0, port)
    const collar = add(`ch${channel}_barrel`, new CylinderGeometry(0.15, 0.15, 0.17, 24, 1, true), silver, 0, 0, 0.07, port); collar.rotation.x = Math.PI / 2
    add(`ch${channel}_rim`, new TorusGeometry(0.14, 0.02, 8, 32), silver, 0, 0, 0.16, port)
    const insulator = add(`ch${channel}_insulator`, new CylinderGeometry(0.119, 0.119, 0.04, 24), ivory, 0, 0, 0.129, port); insulator.rotation.x = Math.PI / 2
    add(`ch${channel}_contact`, new TorusGeometry(0.041, 0.011, 6, 20), gold, 0, 0, 0.157, port)
    const bore = add(`ch${channel}_bore`, new CylinderGeometry(0.03, 0.03, 0.004, 16), rubber, 0, 0, 0.151, port); bore.rotation.x = Math.PI / 2
    // Two bayonet lugs, merged into one geometry, give the BNC a real silhouette.
    const lugs = [-1, 1].map((s) => new BoxGeometry(0.035, 0.055, 0.04).translate(s * 0.15, 0, 0.07))
    add(`ch${channel}_bayonet`, mergeGeometries(lugs)!, silver, 0, 0, 0, port); lugs.forEach((g) => g.dispose())
  }
}
