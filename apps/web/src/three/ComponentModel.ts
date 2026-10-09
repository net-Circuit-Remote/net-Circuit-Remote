import { BoxGeometry, CanvasTexture, CylinderGeometry, Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, Object3D, PlaneGeometry, SphereGeometry, Sprite, SpriteMaterial, Vector3 } from 'three'
import { getDefinition, type LogicalPort } from '../data/editorCatalog'
import type { CircuitModule } from '../types/circuit'

export function disposeObject(root: Object3D) {
  root.traverse((object) => {
    if (object instanceof InstancedMesh) object.dispose()
    const renderable = object as Mesh
    renderable.geometry?.dispose()
    const materials = renderable.material ? (Array.isArray(renderable.material) ? renderable.material : [renderable.material]) : []
    materials.forEach((material) => { if ('map' in material) (material.map as CanvasTexture | null)?.dispose(); material.dispose() })
  })
}

function createBreadboardTexture(): CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const width = 2048
  const height = 746
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Off-white ABS plastic body surface
  ctx.fillStyle = '#f7f8fa'
  ctx.fillRect(0, 0, width, height)

  // Outer plastic beveled border
  ctx.lineWidth = 3
  ctx.strokeStyle = '#cbd3dc'
  ctx.strokeRect(1, 1, width - 2, height - 2)
  ctx.lineWidth = 2
  ctx.strokeStyle = '#e2e7ed'
  ctx.strokeRect(4, 4, width - 8, height - 8)

  const toPx = (wx: number, wz: number): [number, number] => [
    ((wx + 4.4) / 8.8) * width,
    ((wz + 1.6) / 3.2) * height
  ]

  // Power rail recessed channels
  for (const rz of [-1.245, 1.245]) {
    const [, cy] = toPx(0, rz)
    ctx.fillStyle = '#f1f3f6'
    ctx.strokeStyle = '#e2e7ec'
    ctx.lineWidth = 1
    ctx.fillRect(width * 0.02, cy - 38, width * 0.96, 76)
    ctx.strokeRect(width * 0.02, cy - 38, width * 0.96, 76)
  }

  // Center trough / groove channel (separating upper and lower terminal strips)
  const [, cyTrough] = toPx(0, 0)
  ctx.fillStyle = '#e4e8ee'
  ctx.strokeStyle = '#c9d2dc'
  ctx.lineWidth = 1
  ctx.fillRect(width * 0.02, cyTrough - 15, width * 0.96, 30)
  ctx.strokeRect(width * 0.02, cyTrough - 15, width * 0.96, 30)
  ctx.strokeStyle = '#b3beca'
  ctx.beginPath()
  ctx.moveTo(width * 0.02, cyTrough)
  ctx.lineTo(width * 0.98, cyTrough)
  ctx.stroke()

  // Red (+) and Blue (-) power distribution lines
  const [, cyTopBlue] = toPx(0, -1.45)
  const [, cyTopRed] = toPx(0, -1.04)
  const [, cyBotRed] = toPx(0, 1.04)
  const [, cyBotBlue] = toPx(0, 1.45)

  ctx.lineWidth = 4
  ctx.strokeStyle = '#2563eb'; ctx.beginPath(); ctx.moveTo(width * 0.04, cyTopBlue); ctx.lineTo(width * 0.96, cyTopBlue); ctx.stroke()
  ctx.strokeStyle = '#dc2626'; ctx.beginPath(); ctx.moveTo(width * 0.04, cyTopRed); ctx.lineTo(width * 0.96, cyTopRed); ctx.stroke()
  ctx.strokeStyle = '#dc2626'; ctx.beginPath(); ctx.moveTo(width * 0.04, cyBotRed); ctx.lineTo(width * 0.96, cyBotRed); ctx.stroke()
  ctx.strokeStyle = '#2563eb'; ctx.beginPath(); ctx.moveTo(width * 0.04, cyBotBlue); ctx.lineTo(width * 0.96, cyBotBlue); ctx.stroke()

  // Polarity markings (+ / -)
  ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const pxX of [width * 0.028, width * 0.5, width * 0.972]) {
    ctx.fillStyle = '#2563eb'; ctx.fillText('-', pxX, cyTopBlue)
    ctx.fillStyle = '#dc2626'; ctx.fillText('+', pxX, cyTopRed)
    ctx.fillStyle = '#dc2626'; ctx.fillText('+', pxX, cyBotRed)
    ctx.fillStyle = '#2563eb'; ctx.fillText('-', pxX, cyBotBlue)
  }

  // 63 column coordinates
  const pitchX = 7.86 / 62
  const colsX: number[] = []
  for (let i = 0; i < 63; i++) colsX.push(-3.93 + i * pitchX)

  // Column numbers (1, 5, 10 ... 60, 63)
  const [, cyNumTop] = toPx(0, -0.90)
  const [, cyNumBot] = toPx(0, 0.90)
  ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif'
  ctx.fillStyle = '#475569'
  for (let i = 0; i < 63; i++) {
    const colNum = i + 1
    if (colNum === 1 || colNum % 5 === 0 || colNum === 63) {
      const [cx] = toPx(colsX[i], 0)
      ctx.fillText(String(colNum), cx, cyNumTop)
      ctx.fillText(String(colNum), cx, cyNumBot)
    }
  }

  // Row letters (J, I, H, G, F and E, D, C, B, A)
  const rowZUpper = [-0.74, -0.58, -0.42, -0.26, -0.10]
  const rowZLower = [0.10, 0.26, 0.42, 0.58, 0.74]
  const lettersUpper = ['J', 'I', 'H', 'G', 'F']
  const lettersLower = ['E', 'D', 'C', 'B', 'A']
  for (const labelX of [colsX[0] - 0.26, colsX[62] + 0.26]) {
    const [cx] = toPx(labelX, 0)
    for (let r = 0; r < 5; r++) {
      const [, cyU] = toPx(0, rowZUpper[r])
      ctx.fillText(lettersUpper[r], cx, cyU)
      const [, cyL] = toPx(0, rowZLower[r])
      ctx.fillText(lettersLower[r], cx, cyL)
    }
  }

  // Engineering markings on center groove
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif'
  ctx.fillStyle = '#788696'
  ctx.fillText('MB-102', width * 0.25, cyTrough)
  ctx.fillText('net*CIRCUIT', width * 0.75, cyTrough)

  // Socket drawing helper
  const drawSocket = (cx: number, cy: number) => {
    ctx.fillStyle = '#edf1f5'
    ctx.fillRect(cx - 8, cy - 8, 16, 16)
    ctx.strokeStyle = '#c8d1dc'
    ctx.lineWidth = 1
    ctx.strokeRect(cx - 7.5, cy - 7.5, 15, 15)
    ctx.fillStyle = '#161e27'
    ctx.fillRect(cx - 5, cy - 5, 10, 10)
    ctx.fillStyle = '#3b4754'
    ctx.fillRect(cx - 2, cy - 4, 1, 8)
    ctx.fillRect(cx + 2, cy - 4, 1, 8)
  }

  // Terminal sockets (63 cols x 10 rows = 630 sockets)
  for (let c = 0; c < 63; c++) {
    const [cx] = toPx(colsX[c], 0)
    for (const rz of rowZUpper) {
      const [, cy] = toPx(0, rz)
      drawSocket(cx, cy)
    }
    for (const rz of rowZLower) {
      const [, cy] = toPx(0, rz)
      drawSocket(cx, cy)
    }
  }

  // Power rail sockets (50 cols x 4 rows = 200 sockets)
  const powerCols: number[] = []
  for (let g = 0; g < 5; g++) for (let i = 0; i < 5; i++) powerCols.push(g * 6 + i)
  for (let g = 0; g < 5; g++) for (let i = 0; i < 5; i++) powerCols.push(34 + g * 6 + i)

  const powerZ = [-1.35, -1.14, 1.14, 1.35]
  for (const ci of powerCols) {
    const [cx] = toPx(colsX[ci], 0)
    for (const pz of powerZ) {
      const [, cy] = toPx(0, pz)
      drawSocket(cx, cy)
    }
  }

  const texture = new CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export function portAnchor(type: string, port: LogicalPort): Vector3 {
  const definition = getDefinition(type)!
  const side = port.direction === 'output' || (port.direction === 'inout' && definition.ports.indexOf(port) % 2 === 1) ? 1 : -1
  const peers = definition.ports.filter((item) => (item.direction === 'output' || (item.direction === 'inout' && definition.ports.indexOf(item) % 2 === 1) ? 1 : -1) === side)
  return new Vector3(side * (definition.size[0] / 2 + 0.2), definition.size[1] + 0.16, ((peers.indexOf(port) + 1) / (peers.length + 1) - 0.5) * definition.size[2])
}

export function buildComponent(module: CircuitModule): Group {
  const definition = getDefinition(module.type)
  const [w, h, d] = definition?.size ?? [1.5, 0.5, 1]
  const group = new Group()
  group.userData = { kind: 'module', id: module.id, signature: JSON.stringify([module.type, module.properties]) }
  const material = (color: string) => new MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.12 })
  const box = (x: number, y: number, z: number, sx: number, sy: number, sz: number, color: string) => {
    const mesh = new Mesh(new BoxGeometry(sx, sy, sz), material(color)); mesh.position.set(x, y, z); group.add(mesh); return mesh
  }
  const cylinder = (radius: number, height: number, color: string) => new Mesh(new CylinderGeometry(radius, radius, height, 20), material(color))
  const color = definition?.color ?? '#72829a'

  if (definition?.visual === 'resistor') {
    const body = cylinder(0.23, w * 0.7, color); body.rotation.z = Math.PI / 2; body.position.y = h / 2 + 0.08; group.add(body)
    for (const [x, band] of [[-0.4, '#6c4434'], [-0.15, '#272528'], [0.15, '#b64137'], [0.4, '#c8a150']] as const) { const ring = cylinder(0.235, 0.07, band); ring.rotation.z = Math.PI / 2; ring.position.set(x, h / 2 + 0.08, 0); group.add(ring) }
  } else if (definition?.visual === 'capacitor' || definition?.visual === 'led') {
    const body = cylinder(w * 0.35, h, color); body.position.y = h / 2 + 0.05; group.add(body)
    if (definition.visual === 'led') { const dome = new Mesh(new SphereGeometry(w * 0.35, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), material(color)); dome.position.y = h; group.add(dome) }
  } else if (definition?.visual === 'breadboard') {
    // Photorealistic MB-102 830-tie-point solderless breadboard
    box(0, h / 2 + 0.02, 0, w, h, d, color)

    const texture = createBreadboardTexture()
    if (texture) {
      const decal = new Mesh(new PlaneGeometry(w, d), new MeshStandardMaterial({ map: texture, roughness: 0.5, metalness: 0.05 }))
      decal.rotation.x = -Math.PI / 2
      decal.position.set(0, h + 0.0205, 0)
      group.add(decal)
    }

    // Bottom double-sided foam tape backing layer
    const tape = new Mesh(new BoxGeometry(w * 0.995, 0.02, d * 0.995), material('#f0e9d2'))
    tape.position.set(0, 0.01, 0)
    group.add(tape)

    // Dovetail interlocking tabs and notches
    const tabColor = '#ebeef2'
    const notchColor = '#d3d9e2'
    for (const tx of [-2.2, 2.2]) {
      const tabZ = new Mesh(new BoxGeometry(0.35, h * 0.72, 0.12), material(tabColor))
      tabZ.position.set(tx, h / 2 + 0.02, d / 2 + 0.06)
      group.add(tabZ)
      const notchZ = new Mesh(new BoxGeometry(0.37, h * 0.74, 0.06), material(notchColor))
      notchZ.position.set(tx, h / 2 + 0.02, -d / 2 + 0.03)
      group.add(notchZ)
    }
    const tabX = new Mesh(new BoxGeometry(0.12, h * 0.72, 0.45), material(tabColor))
    tabX.position.set(w / 2 + 0.06, h / 2 + 0.02, 0)
    group.add(tabX)
    const notchX = new Mesh(new BoxGeometry(0.06, h * 0.74, 0.47), material(notchColor))
    notchX.position.set(-w / 2 + 0.03, h / 2 + 0.02, 0)
    group.add(notchX)

    // Exactly 1 InstancedMesh with 830 contacts (630 terminal + 200 power rails)
    const pitchX = 7.86 / 62
    const colsX: number[] = []
    for (let i = 0; i < 63; i++) colsX.push(-3.93 + i * pitchX)
    const rowZUpper = [-0.74, -0.58, -0.42, -0.26, -0.10]
    const rowZLower = [0.10, 0.26, 0.42, 0.58, 0.74]
    const powerCols: number[] = []
    for (let g = 0; g < 5; g++) for (let i = 0; i < 5; i++) powerCols.push(g * 6 + i)
    for (let g = 0; g < 5; g++) for (let i = 0; i < 5; i++) powerCols.push(34 + g * 6 + i)
    const powerZ = [-1.35, -1.14, 1.14, 1.35]

    const holeGeom = new BoxGeometry(0.046, 0.012, 0.046)
    const holeMat = new MeshStandardMaterial({ color: '#161e27', roughness: 0.35, metalness: 0.65 })
    const holes = new InstancedMesh(holeGeom, holeMat, 830)
    let idx = 0
    const matrix = new Matrix4()

    for (let c = 0; c < 63; c++) {
      const hx = colsX[c]
      for (const hz of rowZUpper) {
        matrix.makeTranslation(hx, h + 0.021, hz)
        holes.setMatrixAt(idx++, matrix)
      }
      for (const hz of rowZLower) {
        matrix.makeTranslation(hx, h + 0.021, hz)
        holes.setMatrixAt(idx++, matrix)
      }
    }

    for (const ci of powerCols) {
      const hx = colsX[ci]
      for (const hz of powerZ) {
        matrix.makeTranslation(hx, h + 0.021, hz)
        holes.setMatrixAt(idx++, matrix)
      }
    }

    holes.instanceMatrix.needsUpdate = true
    group.add(holes)
  } else {
    box(0, h / 2 + 0.02, 0, w, h, d, color)
    if (definition?.visual === 'board') {
      const holes = new InstancedMesh(new CylinderGeometry(0.04, 0.04, 0.015, 6), material('#52626b'), 160)
      for (let i = 0; i < 160; i++) holes.setMatrixAt(i, new Matrix4().makeTranslation((i % 20 - 9.5) * w / 22, h + 0.035, (Math.floor(i / 20) - 3.5) * d / 10))
      group.add(holes)
      box(0, h + 0.024, 0, w * 0.95, 0.012, 0.12, '#899699')
    }
    if (definition?.visual === 'button') box(0, h + 0.12, 0, w * 0.65, 0.25, d * 0.65, module.properties?.state ? '#d7b58e' : '#835f87')
    if (definition?.visual === 'toggle') { const lever = box(0, h + 0.25, 0, 0.15, 0.55, 0.2, '#c0d1db'); lever.rotation.z = module.properties?.state ? -0.4 : 0.4 }
    if (definition?.visual === 'dip') for (let i = 0; i < 4; i++) box((i - 1.5) * 0.38, h + 0.08, ((Number(module.properties?.value ?? 0) >> i) & 1) ? -0.2 : 0.2, 0.22, 0.18, 0.3, '#e6dac4')
    if (definition?.visual === 'supply' || definition?.visual === 'display' || definition?.visual === 'clock') box(0, h + 0.02, 0, w * 0.72, 0.04, d * 0.65, '#152a2e')
    if (definition?.visual === 'segment') {
      for (const [x, z, sx, sz] of [[0, -0.6, 0.6, 0.1], [0, 0, 0.6, 0.1], [0, 0.6, 0.6, 0.1], [-0.35, -0.3, 0.1, 0.45], [0.35, -0.3, 0.1, 0.45], [-0.35, 0.3, 0.1, 0.45], [0.35, 0.3, 0.1, 0.45]]) box(x, h + 0.04, z, sx, 0.025, sz, '#683839')
    }
  }
  for (const port of definition?.ports ?? []) {
    const anchor = new Mesh(new SphereGeometry(0.115, 12, 8), material(port.direction === 'output' ? '#ddb56d' : port.direction === 'input' ? '#69cbbb' : '#96bde6'))
    anchor.position.copy(portAnchor(module.type, port))
    anchor.userData = { kind: 'port', id: module.id, endpoint: `${module.id}.${port.id}` }
    group.add(anchor)
  }
  if (typeof document !== 'undefined' && definition?.visual !== 'breadboard' && definition?.visual !== 'board') {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 80
    const context = canvas.getContext('2d')
    if (context) {
      context.fillStyle = '#172332e8'; context.fillRect(0, 0, 512, 80)
      context.fillStyle = '#d5e8ee'; context.textAlign = 'center'; context.font = '36px Segoe UI'; context.fillText(module.id + (definition?.visualOnly ? ' · visual' : ''), 256, 53, 500)
      const label = new Sprite(new SpriteMaterial({ map: new CanvasTexture(canvas), depthTest: false, transparent: true })); label.position.set(0, h + 0.7, 0); label.scale.set(3.2, 0.5, 1); label.userData.ignorePick = true; group.add(label)
    }
  }
  applyPose(group, module)
  return group
}
export function applyPose(group: Group, module: CircuitModule) { group.position.set(module.position?.x ?? 0, module.position?.y ?? 0, module.position?.z ?? 0); group.rotation.y = (module.rotation ?? 0) * Math.PI / 180; group.updateMatrixWorld(true) }
