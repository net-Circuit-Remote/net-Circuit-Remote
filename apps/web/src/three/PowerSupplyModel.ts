import { BoxGeometry, CanvasTexture, CylinderGeometry, Group, Mesh, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace, TorusGeometry } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

function panelTexture(): CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas'); canvas.width = 1400; canvas.height = 640
  const ctx = canvas.getContext('2d'); if (!ctx) return null
  ctx.fillStyle = '#202428'; ctx.fillRect(0, 0, 1400, 640)
  ctx.fillStyle = '#c1c6c9'; ctx.font = '600 27px Segoe UI'; ctx.fillText('NET CIRCUIT', 42, 49)
  ctx.fillStyle = '#8d989e'; ctx.font = '20px Segoe UI'; ctx.fillText('DC BENCH SUPPLY', 335, 48)
  ctx.fillStyle = '#0c1115'; ctx.fillRect(100, 87, 850, 328)
  ctx.textAlign = 'right'; ctx.font = '80px Consolas, monospace'
  for (const [text, y, color] of [['—.—  V', 185, '#ba625a'], ['—.—  A', 290, '#5c99b8'], ['—.—  W', 395, '#ba625a']] as const) { ctx.fillStyle = color; ctx.fillText(text, 901, y) }
  ctx.textAlign = 'center'; ctx.font = '18px Segoe UI'; ctx.fillStyle = '#9fa9ad'
  for (const [label, y] of [['V COARSE', 131], ['V FINE', 255], ['A COARSE', 378], ['A FINE', 500]] as const) ctx.fillText(label, 1190, y)
  ctx.font = '26px Segoe UI'; ctx.fillText('+', 442, 461); ctx.fillText('GND', 720, 461); ctx.fillText('−', 997, 461)
  ctx.font = '18px Segoe UI'; ctx.fillStyle = '#87949b'; ctx.fillText('OUTPUT OFF · VISUAL MODEL', 592, 613)
  ctx.fillText('POWER', 122, 473)
  const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; texture.anisotropy = 8; return texture
}

// Decorative terminals and screen are geometry only. POWER_SUPPLY still has no electrical ports.
export function addPowerSupplyModel(group: Group, [w, h, d]: readonly number[]) {
  const mat = (color: string, metalness = 0, roughness = 0.55) => new MeshStandardMaterial({ color, metalness, roughness })
  const add = (name: string, mesh: Mesh, x: number, y: number, z: number, contour = false) => {
    mesh.name = name; mesh.position.set(x, y, z); mesh.userData.selectionSurface = contour; group.add(mesh); return mesh
  }
  const box = (name: string, sx: number, sy: number, sz: number, x: number, y: number, z: number, color: string) => add(name, new Mesh(new BoxGeometry(sx, sy, sz), mat(color)), x, y, z)
  const front = d / 2 - 0.03
  add('supply-enclosure', new Mesh(new RoundedBoxGeometry(w, h - 0.11, d - 0.16, 3, 0.065), mat('#707780', 0.55, 0.42)), 0, h / 2 + 0.045, -0.025, true)
  add('supply-bezel', new Mesh(new RoundedBoxGeometry(w - 0.07, h - 0.14, 0.13, 3, 0.045), mat('#252b30', 0.25)), 0, h / 2 + 0.045, front - 0.08, true)
  const panel = box('supply-front', w - 0.16, h - 0.23, 0.028, 0, h / 2 + 0.045, front, '#ffffff')
  const texture = panelTexture(); if (texture) (panel.material as MeshStandardMaterial).map = texture
  else (panel.material as MeshStandardMaterial).color.set('#202428')
  add('supply-display', new Mesh(new PlaneGeometry(w * 0.61, h * 0.49), new MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.025, metalness: 0.4, roughness: 0.16 })), -w * 0.125, h * 0.69, front + 0.016)
  for (let i = 0; i < 4; i++) {
    const knob = add(`supply-knob-${i}`, new Mesh(new CylinderGeometry(0.082, 0.092, 0.09, 32), mat('#11171b', 0.1, 0.4)), w * 0.35, h * (0.84 - i * 0.18), front + 0.055)
    knob.rotation.x = Math.PI / 2
    for (let r = 0; r < 16; r++) { const angle = r * Math.PI / 8; const ridge = box('knob-flute', 0.012, 0.013, 0.07, knob.position.x + Math.sin(angle) * 0.084, knob.position.y + Math.cos(angle) * 0.084, front + 0.06, '#30363a'); ridge.rotation.z = -angle }
    box('knob-index', 0.012, 0.04, 0.003, knob.position.x, knob.position.y + 0.051, front + 0.102, '#b9c1c5')
  }
  for (const [i, color] of ['#b33b35', '#25856c', '#181e23'].entries()) {
    const x = w * (-0.165 + i * 0.2), y = h * 0.21
    const terminal = add(`supply-terminal-${i}`, new Mesh(new CylinderGeometry(0.075, 0.08, 0.085, 24), mat(color)), x, y, front + 0.064); terminal.rotation.x = Math.PI / 2
    const ring = add('terminal-rim', new Mesh(new TorusGeometry(0.047, 0.011, 8, 24), mat(color)), x, y, front + 0.111)
    box('terminal-socket', 0.05, 0.05, 0.002, x, y, ring.position.z - 0.013, '#080d11')
  }
  box('switch-surround', 0.2, 0.22, 0.045, -w * 0.39, h * 0.20, front + 0.032, '#080e12')
  box('power-switch', 0.145, 0.17, 0.047, -w * 0.39, h * 0.20, front + 0.055, '#8f3732')
  box('switch-mark', 0.009, 0.04, 0.003, -w * 0.39, h * 0.23, front + 0.080, '#ddc9bf')
  for (const side of [-1, 1]) {
    for (let row = 0; row < 2; row++) for (let slot = 0; slot < 12; slot++) box('side-vent', 0.005, h * 0.22, 0.025, side * (w / 2 + 0.001), h * (0.39 + row * 0.31), (slot - 5.5) * d * 0.045, '#242c34')
    for (const z of [-d * 0.29, d * 0.29]) {
      add('rubber-foot', new Mesh(new CylinderGeometry(0.10, 0.10, 0.07, 16), mat('#161e24')), side * w * 0.33, 0.04, z)
      const screw = add('case-screw', new Mesh(new CylinderGeometry(0.032, 0.032, 0.006, 12), mat('#414950', 0.8, 0.3)), side * w * 0.33, h - 0.007, z)
      box('screw-slot', 0.035, 0.004, 0.005, screw.position.x, h - 0.003, z, '#1f272d')
    }
  }
}
