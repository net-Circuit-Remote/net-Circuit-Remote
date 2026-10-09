import { BufferGeometry, Color, Float32BufferAttribute, Group, InstancedMesh, Matrix4, MeshStandardMaterial } from 'three'

export type SocketPosition = [number, number]
export const SOCKET_HALF_OPENING = 0.037

// Visual positions only: no contact, net or physical routing contract is inferred.
export function breadboardSocketPositions(terminal: boolean, rails: boolean): SocketPosition[] {
  const result: SocketPosition[] = [], pitch = 0.13
  const column = (i: number) => (i - 31) * pitch
  if (terminal) {
    for (let c = 0; c < 63; c++) for (const row of [-5.5, -4.5, -3.5, -2.5, -1.5, 1.5, 2.5, 3.5, 4.5, 5.5]) result.push([column(c), row * pitch])
  }
  if (rails || !terminal) {
    const rows = rails ? [-1.18, -1.05, 1.05, 1.18] : [-0.065, 0.065]
    for (const offset of [0, 34]) for (let g = 0; g < 5; g++) for (let i = 0; i < 5; i++) for (const z of rows) result.push([column(offset + g * 6 + i), z])
  }
  return result
}

export function addBreadboardSockets(group: Group, positions: SocketPosition[], height: number) {
  const vertices: number[] = [], colors: number[] = []
  const corners = (radius: number, y: number) => [[-radius, y, -radius], [radius, y, -radius], [radius, y, radius], [-radius, y, radius]]
  const mouth = corners(SOCKET_HALF_OPENING, 0.030), throat = corners(0.024, 0.009), floor = corners(0.024, -0.070)
  const quad = (a: number[], b: number[], c: number[], d: number[], color: string) => {
    const rgb = new Color(color).toArray()
    for (const point of [a, d, b, b, d, c]) { vertices.push(...point); colors.push(...rgb) }
  }
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4
    quad(mouth[i], mouth[next], throat[next], throat[i], '#bdc4c9')
    quad(throat[i], throat[next], floor[next], floor[i], '#65727b')
  }
  quad(floor[0], floor[1], floor[2], floor[3], '#17222b')
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3)); geometry.computeVertexNormals()
  const sockets = new InstancedMesh(geometry, new MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 }), positions.length)
  const matrix = new Matrix4()
  positions.forEach(([x, z], index) => sockets.setMatrixAt(index, matrix.makeTranslation(x, height, z)))
  sockets.instanceMatrix.needsUpdate = true; sockets.userData.breadboardSockets = true
  group.add(sockets)
}
