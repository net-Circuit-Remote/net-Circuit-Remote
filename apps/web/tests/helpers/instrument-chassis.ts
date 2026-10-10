import assert from 'node:assert/strict'
import { Box3, Mesh, Raycaster, Vector3, type Object3D } from 'three'

// Catches an upright enclosure, details left outside the pitched assembly,
// floating/disconnected stands, floor penetration, and pitch leaking onto root.
export function assertSupportedChassis(root: Object3D) {
  const chassis = root.getObjectByName('visual_chassis')
  assert.ok(chassis, 'all case visuals belong to a chassis group')
  assert.equal(root.rotation.x, 0, 'root stays upright for the transform gizmo')
  assert.equal(root.rotation.z, 0)
  const angle = -chassis.rotation.x * 180 / Math.PI
  assert.ok(angle >= 8 && angle <= 12, `chassis leans backward 8–12 degrees, got ${angle}`)
  root.updateMatrixWorld(true)
  const inverse = root.matrixWorld.clone().invert()
  const direction = (node: Object3D, axis: Vector3) => axis.transformDirection(node.matrixWorld).transformDirection(inverse)
  const shell = root.getObjectByName('enclosure') as Mesh
  const up = direction(shell, new Vector3(0, 1, 0))
  assert.ok(up.z < -0.13, 'the enclosure itself must lean backward, not just the feet')
  for (const name of ['front_bezel', 'screen', 'front_legends', 'brand_owl', 'case_vents', 'case_fasteners']) {
    const node = root.getObjectByName(name)!
    assert.equal(node.parent, chassis, `${name} follows the chassis`)
    assert.ok(direction(node, new Vector3(0, 1, 0)).distanceTo(up) < 1e-6, `${name} shares the enclosure pitch`)
  }
  chassis.traverse(node => {
    if (node.userData.interaction) assert.equal(node.parent, chassis, `${node.name} retains its local interaction pivot`)
  })
  // Actual vertices, not a rotated bounding-box approximation.
  const bounds = new Box3().setFromObject(root, true)
  assert.ok(bounds.min.y >= -1e-6, `geometry cannot penetrate Y=0: ${bounds.min.y}`)
  assert.ok(bounds.min.y < 1e-5, 'supports touch the workspace')
  for (const name of ['stand_pad_left', 'stand_pad_right', 'rear_pad_left', 'rear_pad_right']) {
    assert.equal(root.getObjectByName(name), undefined, `${name} has been removed`)
  }
  // Check actual support/case surfaces at both sides.
  shell.geometry.computeBoundingBox()
  const bottom = shell.position.y + shell.geometry.boundingBox!.min.y
  for (const side of ['left', 'right']) {
    const x = (root.name.includes('generator') ? 2.85 : 2.48) * (side === 'left' ? -1 : 1)
    const attachment = chassis.localToWorld(new Vector3(x, bottom + 0.025, 0.78))
    const enclosureHit = new Raycaster(new Vector3(x, -1, attachment.z), new Vector3(0, 1, 0)).intersectObject(shell)[0]
    const stand = root.getObjectByName(root.name.includes('generator') ? 'tilt_stand' : `tilt_foot_${side}`)!
    const standHit = new Raycaster(new Vector3(x, 5, attachment.z), new Vector3(0, -1, 0)).intersectObject(stand)[0]
    assert.ok(enclosureHit && standHit, `${side} stand reaches under the case`)
    assert.ok(standHit.point.y >= enclosureHit.point.y - 1e-5, `${side} stand actually touches the case`)
    const standBounds = new Box3().setFromObject(stand, true)
    assert.ok(Math.abs(standBounds.min.y) < 1e-5, `${side} stand rests directly on the workspace plane`)
  }
  const shellBounds = new Box3().setFromObject(shell, true)
  assert.ok(Math.abs(shellBounds.min.y) < 1e-5, 'rear enclosure rests directly on the workspace plane')
}
