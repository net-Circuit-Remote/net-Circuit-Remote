import { Box3, BoxGeometry, Group, Mesh, Vector3, type BufferGeometry, type Material } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// Y-up, front +Z: negative local X pitch lifts the front and leans the top back.
// Shared by both factories and therefore by their workspace and exported assets.
export const INSTRUMENT_CHASSIS_PITCH = -Math.PI / 18

export function createInstrumentChassis() {
  const chassis = new Group()
  chassis.name = 'visual_chassis'
  chassis.userData = { role: 'visual-chassis', pitchRadians: INSTRUMENT_CHASSIS_PITCH }
  return chassis
}

export function mountInstrumentChassis(root: Group, chassis: Group, standMaterial: Material, rubber: Material, style: 'bail' | 'feet') {
  const enclosure = chassis.getObjectByName('enclosure') as Mesh
  enclosure.geometry.computeBoundingBox()
  const bottom = enclosure.position.y + enclosure.geometry.boundingBox!.min.y
  chassis.rotation.x = INSTRUMENT_CHASSIS_PITCH
  chassis.position.set(0, 0, 0)
  // Measure the detached assembly: caller position, yaw, scale and ancestors
  // cannot affect grounding. Include decal-plane vertices as well as the shell.
  chassis.updateMatrixWorld(true)
  const caseBounds = new Box3().setFromObject(enclosure, true)
  const visualBounds = new Box3().setFromObject(chassis, true)
  // Rear of the pitched chassis enclosure rests directly on the workspace plane (Y=0).
  chassis.position.y = -caseBounds.min.y
  chassis.updateMatrixWorld(true)

  const supports = new Group(); supports.name = 'visual_supports'
  const add = (name: string, geometry: BufferGeometry, material: Material, position = new Vector3()) => {
    const mesh = new Mesh(geometry, material); mesh.name = name; mesh.position.copy(position); supports.add(mesh); return mesh
  }
  const struts: BufferGeometry[] = []
  for (const [side, sign] of [['left', -1], ['right', 1]] as const) {
    const x = sign * (style === 'bail' ? 2.85 : 2.48)
    // The upper end overlaps the flat underside slightly, creating a real
    // mechanical attachment. The lower end rests firmly on the workspace (Y=0).
    const top = new Vector3(x, bottom + 0.025, 0.78).applyMatrix4(chassis.matrixWorld)
    const targetZ = top.z + 0.22

    if (style === 'bail') {
      const barH = 0.12
      const base = new Vector3(x, barH / 2, targetZ)
      const delta = top.clone().sub(base), length = delta.length()
      const angle = Math.atan2(delta.z, delta.y)
      const center = top.clone().add(base).multiplyScalar(0.5)
      struts.push(new RoundedBoxGeometry(0.23, length, 0.16, 1, 0.015).rotateX(angle).translate(center.x, center.y, center.z))
      if (side === 'left') {
        // Continuous horizontal bail bar rests directly on Y=0 from X=-2.97 to X=+2.97
        struts.push(new RoundedBoxGeometry(5.94, barH, 0.16, 1, 0.015).translate(0, barH / 2, targetZ))
      }
    } else {
      const base = new Vector3(x, 0.04, targetZ)
      const delta = top.clone().sub(base), length = delta.length()
      const angle = Math.atan2(delta.z, delta.y)
      const center = top.clone().add(base).multiplyScalar(0.5)
      const geometry = new RoundedBoxGeometry(0.44, length, 0.16, 1, 0.015)
      // Level bottom so it sits flush on Y=0
      const pos = geometry.getAttribute('position')
      const bottomThreshold = -length / 2 + 0.04
      const tan = Math.tan(angle)
      for (let i = 0; i < pos.count; i++) {
        if (pos.getY(i) < bottomThreshold) {
          pos.setY(i, pos.getZ(i) * Math.tan(angle) - center.y / Math.cos(angle))
        }
      }
      geometry.computeVertexNormals()
      const foot = add(`tilt_foot_${side}`, geometry, standMaterial, center)
      foot.rotation.x = angle; foot.userData = { role: 'front-tilt-stand', selectionSurface: true }
      const tread = new Mesh(new BoxGeometry(0.32, length * 0.65, 0.008), rubber)
      tread.name = `stand_tread_${side}`; tread.position.z = 0.084; foot.add(tread)
    }
  }
  if (style === 'bail') {
    const stand = add('tilt_stand', mergeGeometries(struts)!, standMaterial)
    struts.forEach(geometry => geometry.dispose())
    stand.userData = { role: 'hinged-bail', selectionSurface: true }
  }
  // Only visual children carry pitch/grounding. Root remains the editor's
  // Y-up transform frame, including when the factory receives a posed root.
  root.add(chassis, supports)
}
