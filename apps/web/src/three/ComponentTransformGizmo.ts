import { BoxGeometry, ConeGeometry, CylinderGeometry, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Raycaster, TorusGeometry, Vector3 } from 'three'

export type TransformHandle = 'x' | 'z' | 'xz' | 'rotate-y'
export interface GizmoObstacle { left: number; top: number; right: number; bottom: number }

// A scene tool, never a circuit module, port or electrical node.
export function createComponentTransformGizmo() {
  const root = new Group(); root.name = 'component-transform-gizmo'; root.visible = false
  const handles = new Map<TransformHandle, Group>(), markers = new Map<TransformHandle, Vector3>()
  let selectedId: string | null = null, hovered: TransformHandle | null = null, active: TransformHandle | null = null, lockedOffset: Vector3 | null = null
  const material = (color: string, pickOnly = false) => new MeshBasicMaterial({ color, depthTest: false, depthWrite: false, transparent: pickOnly, opacity: pickOnly ? 0 : 1 })
  const handle = (id: TransformHandle, color: string, point: Vector3) => {
    const group = new Group(); group.userData.transformHandle = id; group.userData.color = color
    handles.set(id, group); markers.set(id, point); root.add(group); return group
  }
  const add = (group: Group, mesh: Mesh, pickOnly = false) => { mesh.renderOrder = 20; mesh.userData.pickOnly = pickOnly; group.add(mesh); return mesh }
  for (const id of ['x', 'z'] as const) {
    const color = id === 'x' ? '#d8b09a' : '#9dbedf', group = handle(id, color, new Vector3(id === 'x' ? 0.95 : 0, 0, id === 'z' ? 0.95 : 0))
    const stem = add(group, new Mesh(new CylinderGeometry(0.027, 0.027, 0.66, 8), material(color)))
    const tip = add(group, new Mesh(new ConeGeometry(0.14, 0.32, 3), material(color)))
    const target = add(group, new Mesh(new CylinderGeometry(0.15, 0.15, 0.95, 8), material(color, true)), true)
    if (id === 'x') { stem.rotation.z = tip.rotation.z = target.rotation.z = -Math.PI / 2; stem.position.x = 0.47; tip.position.x = 0.96; target.position.x = 0.61 }
    else { stem.rotation.x = tip.rotation.x = target.rotation.x = Math.PI / 2; stem.position.z = 0.47; tip.position.z = 0.96; target.position.z = 0.61 }
  }
  const free = handle('xz', '#e2e5dc', new Vector3())
  const diamond = add(free, new Mesh(new BoxGeometry(0.27, 0.045, 0.27), material('#e2e5dc'))); diamond.rotation.y = Math.PI / 4
  add(free, new Mesh(new CylinderGeometry(0.23, 0.23, 0.08, 12), material('#e2e5dc', true)), true)
  const rotate = handle('rotate-y', '#b7c7cf', new Vector3(-1.12, 0, 0))
  const arc = add(rotate, new Mesh(new TorusGeometry(1.12, 0.022, 6, 72, Math.PI * 1.5), material('#8b9ca9'))); arc.rotation.x = Math.PI / 2
  const arcTarget = add(rotate, new Mesh(new TorusGeometry(1.12, 0.115, 6, 72, Math.PI * 1.5), material('#8b9ca9', true)), true); arcTarget.rotation.x = Math.PI / 2
  const grip = add(rotate, new Mesh(new TorusGeometry(0.12, 0.043, 8, 24), material('#b7c7cf'))); grip.rotation.x = Math.PI / 2; grip.position.x = -1.12
  const paint = () => {
    for (const [id, group] of handles) for (const mesh of group.children as Mesh[]) {
      if (!mesh.userData.pickOnly) (mesh.material as MeshBasicMaterial).color.set(id === active || id === hovered ? '#65d8cd' : id === 'rotate-y' && mesh === arc ? '#8b9ca9' : group.userData.color)
    }
  }
  const pixelScale = (point: Vector3, camera: PerspectiveCamera, height: number) => Math.max(0.1, -point.clone().applyMatrix4(camera.matrixWorldInverse).z) * 2 * Math.tan(camera.fov * Math.PI / 360) / (height * camera.zoom) * 42
  function update(model: Group | undefined, others: Iterable<Group>, camera: PerspectiveCamera, width: number, height: number, obstacles: readonly GizmoObstacle[] = []) {
    if (!model || height <= 1) { root.visible = false; selectedId = null; hovered = null; active = null; lockedOffset = null; return }
    if (selectedId !== model.userData.id) { hovered = null; active = null; lockedOffset = null; paint() }
    selectedId = model.userData.id; root.visible = true; camera.updateMatrixWorld()
    if (active && lockedOffset) { root.position.copy(model.position).add(lockedOffset); root.scale.setScalar(pixelScale(root.position, camera, height)); root.updateMatrixWorld(true); return }
    const neighbors = [...others] // Map.values() is single-use; all candidates need the same obstacles.
    const near = camera.position.clone().sub(model.position).setY(0).normalize(), right = new Vector3(near.z, 0, -near.x)
    const directions = [near, right, right.clone().negate(), near.clone().negate()]
    const candidates = [1.55, 2.7, 3.9, 5].flatMap((spacing) => directions.map((direction) => ({ direction, spacing })))
    const [w, , d] = model.userData.size as number[], angle = model.rotation.y
    const extent = (direction: Vector3) => { const local = direction.clone().applyAxisAngle(new Vector3(0, 1, 0), -angle); return Math.abs(local.x) * w / 2 + Math.abs(local.z) * d / 2 }
    let best: { point: Vector3; scale: number; score: number } | undefined
    candidates.forEach(({ direction, spacing }, index) => {
      let scale = pixelScale(model.position, camera, height), point = model.position.clone()
      for (let i = 0; i < 3; i++) { point = model.position.clone().addScaledVector(direction, extent(direction) + scale * spacing).add(new Vector3(0, 0.04, 0)); scale = pixelScale(point, camera, height) }
      const screen = point.clone().project(camera), px = (screen.x + 1) * width / 2, py = (1 - screen.y) * height / 2
      let score = index * 10
      if (screen.z < -1 || screen.z > 1) score += 10000
      score += Math.max(0, 70 - px, px - width + 70) * 10 + Math.max(0, 70 - py, py - height + 70) * 10
      for (const area of obstacles) if (px + 60 > area.left && px - 60 < area.right && py + 55 > area.top && py - 55 < area.bottom) score += 10000
      for (const other of neighbors) {
        if (other === model) continue
        const [ow, , od] = other.userData.size as number[], a = other.rotation.y
        const ex = (Math.abs(Math.cos(a)) * ow + Math.abs(Math.sin(a)) * od) / 2, ez = (Math.abs(Math.sin(a)) * ow + Math.abs(Math.cos(a)) * od) / 2
        if (Math.abs(point.x - other.position.x) < ex + scale * 1.4 && Math.abs(point.z - other.position.z) < ez + scale * 1.4) score += 1000
      }
      if (!best || score < best.score) best = { point, scale, score }
    })
    if (best) { root.position.copy(best.point); root.scale.setScalar(best.scale) }
    root.updateMatrixWorld(true)
  }
  return {
    root, update,
    position(id: TransformHandle) { return root.visible ? root.localToWorld(markers.get(id)!.clone()) : null },
    origin() { return root.visible ? root.position.clone() : null },
    pick(ray: Raycaster) {
      if (!root.visible || !selectedId) return null
      for (const hit of ray.intersectObject(root, true)) {
        let object = hit.object
        while (object.parent && !object.userData.transformHandle) object = object.parent
        if (object.userData.transformHandle) return { id: selectedId, handle: object.userData.transformHandle as TransformHandle, point: hit.point.clone() }
      }
      return null
    },
    hover(id: TransformHandle | null) { hovered = id; paint() },
    activate(id: TransformHandle | null, model?: Group) { active = id; lockedOffset = id && model ? root.position.clone().sub(model.position) : null; hovered = null; paint() },
  }
}
