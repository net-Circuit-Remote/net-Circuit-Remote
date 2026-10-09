import { Group, InterleavedBufferAttribute, Mesh, Vector3 } from 'three'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'

interface Face { normal: Vector3; center: Vector3 }
interface ContourEdge { a: Vector3; b: Vector3; faces: Face[] }
const updates = new WeakMap<Group, (camera: Vector3) => void>()
export function updateSelectionOutline(outline: Group, camera: Vector3, width: number, height: number) {
  const stroke = outline.children[0] as LineSegments2
  stroke.material.resolution.set(width, height)
  updates.get(outline)?.(camera)
}

// Weld triangle positions across UV/normal seams; keep only silhouette and visible creases.
function surfaceEdges(model: Group): ContourEdge[] {
  const edges: ContourEdge[] = []
  model.traverse((object) => {
    if (!(object instanceof Mesh) || !object.userData.selectionSurface) return
    object.updateMatrix()
    const positions = object.geometry.getAttribute('position'), index = object.geometry.getIndex()
    const count = index?.count ?? positions.count, map = new Map<string, ContourEdge>()
    const key = (point: Vector3) => [point.x, point.y, point.z].map((value) => Math.round(value * 1e5)).join(',')
    for (let i = 0; i < count; i += 3) {
      const points = [0, 1, 2].map((offset) => new Vector3().fromBufferAttribute(positions, index ? index.getX(i + offset) : i + offset).applyMatrix4(object.matrix))
      const [a, b, c] = points, normal = b.clone().sub(a).cross(c.clone().sub(a))
      if (normal.lengthSq() < 1e-12) continue
      const face = { normal: normal.normalize(), center: a.clone().add(b).add(c).multiplyScalar(1 / 3) }
      for (let j = 0; j < 3; j++) {
        const a = points[j], b = points[(j + 1) % 3], edgeKey = [key(a), key(b)].sort().join('|')
        const existing = map.get(edgeKey)
        if (existing) existing.faces.push(face)
        else map.set(edgeKey, { a, b, faces: [face] })
      }
    }
    edges.push(...map.values())
  })
  return edges
}

export function createSelectionOutline(model: Group): Group {
  const outline = new Group()
  outline.userData = { ignorePick: true, isOutline: true }
  const positions: number[] = []
  const edge = (a: number[], b: number[]) => positions.push(...a, ...b)
  const profile = model.userData.selectionProfile as [number, number][] | undefined
  if (profile) {
    const top = Number(model.userData.selectionHeight) + 0.004, bottom = 0.016
    for (let i = 0; i < profile.length; i++) {
      const [x, z] = profile[i], [nx, nz] = profile[(i + 1) % profile.length]
      edge([x, top, z], [nx, top, nz]); edge([x, bottom, z], [nx, bottom, nz])
      edge([x, bottom, z], [x, top, z])
    }
  }
  const geometry = new LineSegmentsGeometry()
  if (profile) geometry.setPositions(positions)
  const line = new LineSegments2(geometry, new LineMaterial({ color: '#d4af37', linewidth: 2, worldUnits: false, transparent: true, opacity: 1, depthTest: true, depthWrite: false, toneMapped: false }))
  line.userData.ignorePick = true
  // Render-only strokes must never compete with the component's picking surface.
  line.raycast = () => {}
  outline.add(line)
  if (!profile) {
    const edges = surfaceEdges(model)
    geometry.setPositions(new Float32Array(edges.length * 6))
    const starts = geometry.getAttribute('instanceStart') as InterleavedBufferAttribute
    const ends = geometry.getAttribute('instanceEnd') as InterleavedBufferAttribute
    let lastView = ''
    const update = (camera: Vector3) => {
      const view = model.worldToLocal(camera.clone()), signature = view.toArray().map((value) => value.toFixed(6)).join(',')
      if (signature === lastView) return
      lastView = signature
      let count = 0
      for (const edge of edges) {
        const front = edge.faces.map((face) => view.clone().sub(face.center).dot(face.normal) > 0)
        const silhouette = front.some(Boolean) && (edge.faces.length === 1 || front.some((value) => !value))
        const crease = front.every(Boolean) && edge.faces.length === 2 && edge.faces[0].normal.dot(edge.faces[1].normal) < Math.cos(35 * Math.PI / 180)
        if (!silhouette && !crease) continue
        starts.setXYZ(count, edge.a.x * 1.004, edge.a.y * 1.004, edge.a.z * 1.004)
        ends.setXYZ(count++, edge.b.x * 1.004, edge.b.y * 1.004, edge.b.z * 1.004)
      }
      starts.data.needsUpdate = true; geometry.instanceCount = count; geometry.computeBoundingSphere()
    }
    updates.set(outline, update)
    // Initial geometry is ready even before the first scheduled frame.
    update(model.localToWorld(new Vector3(0, 11, 10)))
  }
  return outline
}
