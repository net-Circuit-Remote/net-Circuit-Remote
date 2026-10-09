import { CanvasTexture, ExtrudeGeometry, Group, Mesh, MeshStandardMaterial, Path, Shape, ShapeGeometry } from 'three'

// Visual housing only. These contours and recesses never define electrical nets.
export function addBreadboardHousing(group: Group, size: number[], color: string, texture: CanvasTexture | null, terminal: boolean, rails: boolean) {
  const [w, h, d] = size
  const points: [number, number][] = [[-w / 2, -d / 2]]
  for (const x of [-w * 0.3, 0, w * 0.3]) points.push([x - 0.16, -d / 2], [x - 0.12, -d / 2 - 0.055], [x + 0.12, -d / 2 - 0.055], [x + 0.16, -d / 2])
  points.push([w / 2, -d / 2], [w / 2, -0.19], [w / 2 + 0.065, -0.14], [w / 2 + 0.065, 0.14], [w / 2, 0.19], [w / 2, d / 2])
  for (const x of [w * 0.3, 0, -w * 0.3]) points.push([x + 0.16, d / 2], [x + 0.12, d / 2 - 0.055], [x - 0.12, d / 2 - 0.055], [x - 0.16, d / 2])
  points.push([-w / 2, d / 2], [-w / 2, 0.19], [-w / 2 + 0.065, 0.14], [-w / 2 + 0.065, -0.14], [-w / 2, -0.19])
  const shape = () => {
    const result = new Shape()
    points.forEach(([x, z], i) => i ? result.lineTo(x, -z) : result.moveTo(x, -z))
    result.closePath()
    return result
  }
  const baseShape = shape(), deckShape = shape()
  function slot(z: number, width: number) {
    const inset = 0.18, left = -w / 2 + inset, right = w / 2 - inset
    const path = new Path()
    path.moveTo(left, -z - width / 2); path.lineTo(right, -z - width / 2)
    path.lineTo(right, -z + width / 2); path.lineTo(left, -z + width / 2); path.closePath()
    deckShape.holes.push(path)
  }
  if (terminal) slot(0, 0.21)
  if (rails) { slot(-0.93, 0.025); slot(0.93, 0.025) }
  const body = (profile: Shape, height: number, y: number, bodyColor: string) => {
    const geometry = new ExtrudeGeometry(profile, { depth: height, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 1, curveSegments: 1 })
    geometry.rotateX(-Math.PI / 2)
    const mesh = new Mesh(geometry, new MeshStandardMaterial({ color: bodyColor, roughness: 0.82, metalness: 0 }))
    mesh.position.y = y; group.add(mesh)
    return mesh
  }
  body(baseShape, 0.09, 0.02, '#c6cbd0')
  const deck = body(deckShape, h - 0.09, 0.11, color)
  deck.userData.breadboardDeck = true
  if (texture) {
    const geometry = new ShapeGeometry(deckShape)
    geometry.rotateX(-Math.PI / 2)
    const positions = geometry.getAttribute('position'), uv = geometry.getAttribute('uv')
    for (let i = 0; i < positions.count; i++) uv.setXY(i, (positions.getX(i) + w / 2) / w, 0.5 - positions.getZ(i) / d)
    const face = new Mesh(geometry, new MeshStandardMaterial({ map: texture, roughness: 0.86, metalness: 0 }))
    face.position.y = h + 0.030; group.add(face)
  }
  group.userData.selectionProfile = points
  group.userData.selectionHeight = h + 0.031
}
