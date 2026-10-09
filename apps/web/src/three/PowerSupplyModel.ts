import { BoxGeometry, CanvasTexture, CylinderGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace, TorusGeometry } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void): CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
  const ctx = canvas.getContext('2d'); if (!ctx) return null
  draw(ctx)
  const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; texture.anisotropy = 8; return texture
}

function displayTexture() {
  return canvasTexture(700, 960, (ctx) => {
    ctx.fillStyle = '#080c10'; ctx.fillRect(0, 0, 700, 960)
    // Reference-photo numbers are not telemetry. Keep every readout unknown.
    for (const [row, unit, color] of [[0, 'V', '#ff493c'], [1, 'A', '#30b4ff'], [2, 'W', '#ff493c']] as const) {
      const y = 150 + row * 265
      ctx.fillStyle = color
      for (let digit = 0; digit < 4; digit++) {
        const x = 72 + digit * 120
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 17, y - 9); ctx.lineTo(x + 80, y - 9)
        ctx.lineTo(x + 91, y); ctx.lineTo(x + 74, y + 9); ctx.lineTo(x + 11, y + 9); ctx.closePath(); ctx.fill()
      }
      ctx.beginPath(); ctx.arc(306, y + 68, 7, 0, Math.PI * 2); ctx.fill()
      ctx.font = '600 64px Segoe UI'; ctx.fillText(unit, 584, y + 28)
    }
    ctx.fillStyle = '#819398'; ctx.font = '22px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('OUTPUT OFF', 350, 897)
  })
}

function legendsTexture(w: number, h: number) {
  return canvasTexture(960, 1120, (ctx) => {
    const px = (x: number) => (x / (w - 0.16) + 0.5) * 960
    const py = (y: number) => (0.5 - (y - (h + 0.14) / 2) / (h - 0.26)) * 1120
    const text = (label: string, x: number, y: number, size = 34) => { ctx.font = `500 ${size}px Segoe UI`; ctx.fillText(label, px(x), py(y)) }
    ctx.fillStyle = '#c7d0d4'; ctx.textAlign = 'center'
    for (const [label, fraction] of [['Voltage', 0.76], ['Ampe', 0.43]] as const) {
      const x = w * 0.335, y = h * fraction, radius = w * 0.14
      ctx.strokeStyle = '#c7d0d4'; ctx.lineWidth = 3
      for (let i = 0; i <= 10; i++) {
        const angle = -Math.PI * 0.77 + i * Math.PI * 1.54 / 10
        ctx.beginPath(); ctx.moveTo(px(x + Math.sin(angle) * radius), py(y + Math.cos(angle) * radius))
        ctx.lineTo(px(x + Math.sin(angle) * (radius + 0.033)), py(y + Math.cos(angle) * (radius + 0.033))); ctx.stroke()
      }
      text(label, x, y - w * 0.105 - 0.11, 38)
    }
    text('Vcc', -w * 0.02, h * 0.245, 38); text('Gnd', w * 0.31, h * 0.245, 38)
    text('POWER', -w * 0.35, h * 0.245, 21)
    ctx.fillStyle = '#a5b3ba'; text('NET CIRCUIT · DC BENCH SUPPLY', -w * 0.135, h * 0.966, 17)
  })
}

// Case, knobs, sockets and switch are decorative. The supply creates no electrical ports.
export function addPowerSupplyModel(group: Group, [w, h, d]: readonly number[]) {
  const mat = (color: string, metalness = 0, roughness = 0.55) => new MeshStandardMaterial({ color, metalness, roughness })
  const add = (name: string, mesh: Mesh, x: number, y: number, z: number, contour = false) => {
    mesh.name = name; mesh.position.set(x, y, z); mesh.userData.selectionSurface = contour; group.add(mesh); return mesh
  }
  const box = (name: string, sx: number, sy: number, sz: number, x: number, y: number, z: number, color: string) => add(name, new Mesh(new BoxGeometry(sx, sy, sz), mat(color)), x, y, z)
  const front = d / 2, panelY = (h + 0.14) / 2
  add('supply-enclosure', new Mesh(new RoundedBoxGeometry(w, h - 0.14, d - 0.16, 4, 0.065), mat('#a1aab4', 0.48, 0.38)), 0, panelY, -0.08, true)
  add('supply-bezel', new Mesh(new RoundedBoxGeometry(w - 0.035, h - 0.17, 0.16, 4, 0.045), mat('#30383e', 0.32, 0.4)), 0, panelY, front - 0.08, true)
  add('supply-front', new Mesh(new RoundedBoxGeometry(w - 0.16, h - 0.26, 0.025, 3, 0.025), mat('#272e33', 0.24, 0.52)), 0, panelY, front + 0.003)
  add('control-strip', new Mesh(new RoundedBoxGeometry(w * 0.265, h * 0.71, 0.025, 3, 0.027), mat('#343c42', 0.2, 0.48)), w * 0.335, h * 0.625, front + 0.025)
  add('display-recess', new Mesh(new RoundedBoxGeometry(w * 0.63, h * 0.72, 0.035, 3, 0.035), mat('#080d12')), -w * 0.135, h * 0.625, front + 0.022)
  const screen = displayTexture()
  add('supply-display', new Mesh(new PlaneGeometry(w * 0.60, h * 0.69), new MeshBasicMaterial({ color: screen ? '#ffffff' : '#080c10', map: screen, toneMapped: false })), -w * 0.135, h * 0.625, front + 0.041)
  const legends = legendsTexture(w, h)
  if (legends) add('front-legends', new Mesh(new PlaneGeometry(w - 0.16, h - 0.26), new MeshBasicMaterial({ map: legends, transparent: true, depthWrite: false, toneMapped: false })), 0, panelY, front + 0.055)

  for (const [i, fraction] of [0.76, 0.43].entries()) {
    const x = w * 0.335, y = h * fraction, radius = w * 0.105
    add('knob-collar', new Mesh(new TorusGeometry(radius + 0.018, 0.018, 12, 40), mat('#68737a', 0.65, 0.3)), x, y, front + 0.055)
    const knob = add(`supply-knob-${i}`, new Mesh(new CylinderGeometry(radius, radius + 0.006, 0.17, 40), mat('#141b20', 0.15, 0.36)), x, y, front + 0.125); knob.rotation.x = Math.PI / 2
    for (let r = 0; r < 24; r++) {
      const angle = r * Math.PI / 12
      const ridge = box('knob-flute', 0.022, 0.018, 0.15, x + Math.sin(angle) * radius, y + Math.cos(angle) * radius, front + 0.13, '#465159'); ridge.rotation.z = -angle
    }
    const cap = add('knob-cap', new Mesh(new CylinderGeometry(radius * 0.88, radius * 0.88, 0.016, 40), mat('#2b343b', 0.25, 0.4)), x, y, front + 0.218); cap.rotation.x = Math.PI / 2
    box('knob-index', 0.025, radius * 0.46, 0.008, x, y + radius * 0.52, front + 0.231, '#d3dce0')
  }
  for (const [i, color] of ['#dc3b32', '#20272c'].entries()) {
    const x = w * (i === 0 ? -0.02 : 0.31), y = h * 0.14
    const base = add(`supply-terminal-${i}`, new Mesh(new CylinderGeometry(0.18, 0.18, 0.11, 32, 1, true), mat(color)), x, y, front + 0.072); base.rotation.x = Math.PI / 2
    add('terminal-flange', new Mesh(new TorusGeometry(0.154, 0.027, 12, 32), mat(color)), x, y, front + 0.112)
    const collar = add('binding-post-grip', new Mesh(new CylinderGeometry(0.137, 0.145, 0.17, 32, 1, true), mat('#1c252b', 0.1, 0.45)), x, y, front + 0.177); collar.rotation.x = Math.PI / 2
    for (let r = 0; r < 20; r++) {
      const angle = r * Math.PI / 10
      const ridge = box('post-flute', 0.016, 0.017, 0.15, x + Math.sin(angle) * 0.141, y + Math.cos(angle) * 0.141, front + 0.177, '#4a5358'); ridge.rotation.z = -angle
    }
    add('post-rim', new Mesh(new TorusGeometry(0.105, 0.033, 12, 32), mat(i === 0 ? '#f04c3d' : '#657079', 0.25, 0.35)), x, y, front + 0.267)
    const bore = add('socket-bore', new Mesh(new CylinderGeometry(0.073, 0.073, 0.16, 32, 1, true), new MeshStandardMaterial({ color: '#0b1117', side: DoubleSide, roughness: 0.8 })), x, y, front + 0.174); bore.rotation.x = Math.PI / 2
    const shadow = add('socket-floor', new Mesh(new CylinderGeometry(0.073, 0.073, 0.002, 32), mat('#030609')), x, y, front + 0.095); shadow.rotation.x = Math.PI / 2
  }
  const switchX = -w * 0.35, switchY = h * 0.14
  add('switch-surround', new Mesh(new RoundedBoxGeometry(0.38, 0.48, 0.075, 3, 0.025), mat('#0c1218')), switchX, switchY, front + 0.045)
  const rocker = add('power-switch', new Mesh(new RoundedBoxGeometry(0.27, 0.37, 0.055, 3, 0.016), mat('#e44335', 0.1, 0.4)), switchX, switchY, front + 0.096); rocker.rotation.x = -0.1
  const switchLegend = canvasTexture(100, 160, (ctx) => { ctx.fillStyle = '#f8eeea'; ctx.textAlign = 'center'; ctx.font = '46px Segoe UI'; ctx.fillText('I', 50, 56); ctx.fillText('O', 50, 126) })
  if (switchLegend) add('switch-legend', new Mesh(new PlaneGeometry(0.22, 0.33), new MeshBasicMaterial({ map: switchLegend, transparent: true, toneMapped: false })), switchX, switchY, front + 0.145)

  for (const side of [-1, 1]) {
    for (let row = 0; row < 2; row++) for (let slot = 0; slot < 12; slot++) {
      add('side-vent', new Mesh(new RoundedBoxGeometry(0.022, h * 0.18, 0.06, 3, 0.01), mat('#101a21', 0.1, 0.8)), side * w / 2, h * (0.40 + row * 0.29), (slot - 5.5) * d * 0.058 - 0.07)
    }
    for (const z of [-d * 0.32, d * 0.32]) {
      add('rubber-foot', new Mesh(new CylinderGeometry(0.15, 0.16, 0.14, 24), mat('#151d23')), side * w * 0.34, 0.075, z)
      const screw = add('case-screw', new Mesh(new CylinderGeometry(0.035, 0.035, 0.007, 20), mat('#46525c', 0.75, 0.32)), side * w * 0.34, h - 0.002, z)
      box('screw-slot', 0.04, 0.003, 0.006, screw.position.x, h + 0.002, z, '#18232b')
      box('screw-slot', 0.006, 0.003, 0.04, screw.position.x, h + 0.002, z, '#18232b')
    }
  }
}
