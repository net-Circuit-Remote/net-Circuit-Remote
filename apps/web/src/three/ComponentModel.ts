import { BoxGeometry, CanvasTexture, CylinderGeometry, Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, Object3D, SphereGeometry, Sprite, SpriteMaterial, Vector3 } from 'three'
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
  } else {
    box(0, h / 2 + 0.02, 0, w, h, d, color)
    if (definition?.visual === 'breadboard' || definition?.visual === 'board') {
      // Decorative contacts only: canonical breadboard node_map is unconfirmed.
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
  if (typeof document !== 'undefined') {
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
