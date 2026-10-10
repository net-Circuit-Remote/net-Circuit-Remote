import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Box3, Group, Mesh, Vector3 } from 'three'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { addFunctionGeneratorModel } from '../src/three/FunctionGeneratorModel'
import { addOscilloscopeModel } from '../src/three/OscilloscopeModel'
import { buildComponent, disposeObject } from '../src/three/ComponentModel'
import { createSelectionOutline, updateSelectionOutline } from '../src/three/SelectionOutline'
import { assertSupportedChassis } from './helpers/instrument-chassis'

for (const [name, factory] of [['generator', addFunctionGeneratorModel], ['oscilloscope', addOscilloscopeModel]] as const) {
  test(`${name} pitches the entire case while its front and rear supports contact the workspace`, () => {
    const root = new Group()
    factory(root)
    try { assertSupportedChassis(root) } finally { disposeObject(root) }
  })
  test(`${name} factory preserves a supplied root pose and grounds geometry in root-local space`, () => {
    const root = new Group(), parent = new Group()
    parent.position.set(-4, 0, 7); parent.rotation.y = 0.3; parent.add(root)
    root.position.set(2, 0, -3); root.rotation.y = Math.PI / 4; root.scale.setScalar(1.2)
    const before = [root.position.toArray(), root.quaternion.toArray(), root.scale.toArray()]
    factory(root); parent.updateMatrixWorld(true)
    try {
      assert.deepEqual([root.position.toArray(), root.quaternion.toArray(), root.scale.toArray()], before)
      const bounds = new Box3().setFromObject(root, true)
      assert.ok(Math.abs(bounds.min.y) < 1e-6, 'grounding must not depend on world X/Z or yaw')
      const screen = root.getObjectByName('screen')!
      const front = new Vector3(0, 0, 1).transformDirection(screen.matrixWorld)
      assert.ok(front.y > 0.13, 'screen faces upward after root yaw')
    } finally { disposeObject(root) }
  })
}

test('generator and oscilloscope share the same backward chassis pitch', () => {
  const generator = new Group(), scope = new Group()
  addFunctionGeneratorModel(generator); addOscilloscopeModel(scope)
  try {
    const gen = generator.getObjectByName('visual_chassis')!, osc = scope.getObjectByName('visual_chassis')!
    assert.ok(gen && osc)
    assert.equal(gen.rotation.x, osc.rotation.x)
  } finally { disposeObject(generator); disposeObject(scope) }
})

for (const type of ['GENERATOR', 'OSCILLOSCOPE']) {
  test(`${type} selection contours follow the pitched surfaces after movement and yaw`, () => {
    const model = buildComponent({ id: 'I', type, position: { x: 2, y: 0.25, z: -3 }, rotation: 45 })
    const outline = createSelectionOutline(model); model.add(outline)
    try {
      for (const camera of [new Vector3(9, 7, 10), new Vector3(-10, 4, -8)]) {
        updateSelectionOutline(outline, camera, 1000, 700)
        model.updateWorldMatrix(true, true)
        const vertices: Vector3[] = []
        model.traverse(node => {
          if (!(node instanceof Mesh) || !node.userData.selectionSurface) return
          const positions = node.geometry.getAttribute('position')
          for (let i = 0; i < positions.count; i++) {
            const world = node.localToWorld(new Vector3().fromBufferAttribute(positions, i))
            vertices.push(model.worldToLocal(world))
          }
        })
        const line = outline.children[0] as LineSegments2
        assert.ok(line.geometry.instanceCount > 0)
        for (const name of ['instanceStart', 'instanceEnd']) {
          const points = line.geometry.getAttribute(name)
          for (let i = 0; i < line.geometry.instanceCount; i++) {
            const point = new Vector3().fromBufferAttribute(points, i)
            const nearest = Math.min(...vertices.map(vertex => vertex.distanceTo(point)))
            // The existing contour expands surfaces by 0.4% to avoid z-fighting;
            // that margin is <0.03 here. Omitting chassis pitch drifts by >0.7.
            assert.ok(nearest < 0.03, `contour misses the selected surface by ${nearest}`)
          }
        }
      }
    } finally { disposeObject(model) }
  })
}
