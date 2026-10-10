import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Vector3 } from 'three'
import { createSceneManager } from '../src/three/SceneManager'

function setup(onZoomChange?: (percent: number) => void) {
  const canvas = Object.assign(new EventTarget(), {
    style: { touchAction: '' }, clientWidth: 1000, clientHeight: 700,
    getRootNode: () => new EventTarget(), setPointerCapture() {}, releasePointerCapture() {},
  })
  const options = { canvas: canvas as unknown as HTMLCanvasElement,
    renderer: { setSize() {}, render() {}, dispose() {} }, requestFrame: () => 1, cancelFrame() {}, onZoomChange }
  const manager = createSceneManager(options)
  manager.resize(1000, 700)
  const wheel = (deltaY: number) => canvas.dispatchEvent(Object.assign(new Event('wheel', { cancelable: true }), { deltaY, deltaMode: 0, ctrlKey: false, clientX: 500, clientY: 350 }))
  return { manager, wheel, canvas }
}

test('wheel and toolbar use target-relative dolly with one reported zoom and reversible limits', () => {
  const reports: number[] = [], { manager, wheel } = setup((value) => reports.push(value))
  try {
    const initial = manager.camera.position.clone(), distance = initial.length()
    manager.setZoom(150)
    assert.ok(Math.abs(manager.camera.position.length() - distance / 1.5) < 1e-6)
    assert.equal(manager.camera.zoom, 1, 'keep one perspective projection through all navigation')
    assert.equal(reports.at(-1), 150)
    wheel(-100)
    assert.ok(reports.at(-1)! > 150, 'wheel changes must be visible to the toolbar')
    for (let i = 0; i < 40; i++) wheel(-100)
    assert.ok(Math.abs(manager.camera.position.length() - distance / 2) < 1e-6)
    for (let i = 0; i < 60; i++) wheel(100)
    assert.ok(Math.abs(manager.camera.position.length() - distance * 2) < 1e-6)
    manager.setZoom(100)
    assert.ok(manager.camera.position.distanceTo(initial) < 1e-6)
    manager.pan(2, 3); manager.orbit(75)
    const before = manager.camera.position.clone(), heading = manager.camera.quaternion.clone()
    manager.setZoom(200); manager.setZoom(100)
    assert.ok(manager.camera.position.distanceTo(before) < 1e-6)
    assert.ok(manager.camera.quaternion.angleTo(heading) < 1e-6)
  } finally { manager.dispose() }
})

test('navigation and viewport aspect preserve uniform model and gizmo scale and pixel proportions', () => {
  const { manager, wheel } = setup()
  try {
    const graph = { schema_version: '1.0' as const, circuit_id: 'nav', modules: [{ id: 'A', type: 'CLOCK' }], connections: [] }
    const snapshot = JSON.stringify(graph)
    manager.syncGraph(graph); manager.highlight('A')
    const model = manager.models.get('A')!, pose = model.matrixWorld.clone()
    const squareRatio = () => {
      manager.camera.updateMatrixWorld()
      const center = manager.camera.position.clone().addScaledVector(manager.camera.getWorldDirection(new Vector3()), 10)
      const right = new Vector3(1, 0, 0).applyQuaternion(manager.camera.quaternion)
      const up = new Vector3(0, 1, 0).applyQuaternion(manager.camera.quaternion)
      const a = manager.project(center), b = manager.project(center.clone().add(right)), c = manager.project(center.clone().add(up))
      return Math.hypot(b.x - a.x, b.y - a.y) / Math.hypot(c.x - a.x, c.y - a.y)
    }
    for (const [w, h] of [[1000, 700], [480, 900], [1700, 400]]) {
      manager.resize(w, h); manager.pan(1, -0.5); manager.orbit(20); manager.setZoom(125); wheel(-30)
      assert.ok(Math.abs(squareRatio() - 1) < 1e-6, 'a camera-facing square must remain square in CSS pixels')
      assert.deepEqual(model.scale.toArray(), [1, 1, 1])
      model.updateWorldMatrix(true, true); assert.ok(model.matrixWorld.equals(pose))
      manager.gizmoOrigin()
      const scale = manager.scene.getObjectByName('component-transform-gizmo')!.scale
      assert.equal(scale.x, scale.y); assert.equal(scale.y, scale.z)
    }
    assert.equal(JSON.stringify(graph), snapshot)
    manager.fitCircuit(); assert.equal(manager.camera.zoom, 1)
  } finally { manager.dispose() }
})

test('non-finite zoom, resize, move and pointer inputs leave the valid scene usable', () => {
  const { manager } = setup()
  try {
    manager.syncGraph({ schema_version: '1.0', circuit_id: 'invalid', modules: [{ id: 'A', type: 'CLOCK' }], connections: [] })
    const camera = manager.camera.position.clone(), projection = manager.camera.projectionMatrix.clone(), model = manager.models.get('A')!
    manager.setZoom(NaN); manager.setZoom(Infinity); manager.resize(Infinity, 700); manager.resize(1000, NaN)
    manager.previewMove('A', { x: NaN, y: 0, z: Infinity }); manager.panGrab(new Vector3(), NaN, Infinity)
    assert.ok(manager.camera.position.equals(camera)); assert.ok(manager.camera.projectionMatrix.equals(projection))
    assert.deepEqual(model.position.toArray(), [0, 0, 0])
    assert.equal(manager.groundPoint(NaN, 1), null)
    assert.equal(manager.pick(Infinity, 1), null)
    manager.resize(1000, 700); assert.ok(manager.groundPoint(500, 350))
  } finally { manager.dispose() }
})

test('pan near the ground horizon rejects remote intersections instead of throwing the view away', () => {
  const { manager } = setup()
  try {
    manager.camera.position.set(0, 1, 20); manager.camera.lookAt(0, 0, 0)
    const anchor = manager.groundPoint(500, 500)!, before = manager.camera.position.clone()
    assert.ok(anchor, 'start the grab on the visible foreground')
    const horizon = manager.project(new Vector3(0, 0, -1e9))
    manager.panGrab(anchor, horizon.x, horizon.y + 0.001)
    assert.ok(manager.camera.position.distanceTo(before) < 1e-6, 'an almost parallel ray cannot cause a huge jump')
    manager.panGrab(anchor, 510, 500)
    assert.ok(manager.camera.position.distanceTo(before) > 0.01, 'ordinary grab still pans')
  } finally { manager.dispose() }
})

test('captured orbit, unlock and resume cannot poison a temporarily zero-height viewport', () => {
  const { manager, canvas, wheel } = setup()
  const pointer = (type: string, x: number, y: number) => canvas.dispatchEvent(Object.assign(new Event(type), { button: 2, pointerId: 1, pointerType: 'mouse', clientX: x, clientY: y }))
  try {
    const initial = manager.camera.position.clone()
    pointer('pointerdown', 500, 350)
    canvas.clientHeight = 0; manager.resize(1000, 0)
    manager.lockPointer(false); manager.suspend(false)
    pointer('pointermove', 600, 450); pointer('pointerup', 600, 450); wheel(-100)
    assert.ok(manager.camera.position.equals(initial), 'hidden viewport must ignore camera input, including after unlock/resume')
    assert.ok(manager.camera.quaternion.toArray().every(Number.isFinite))
    canvas.clientHeight = 700; manager.resize(1000, 700)
    pointer('pointerdown', 500, 350); pointer('pointermove', 600, 450); pointer('pointerup', 600, 450)
    assert.ok(manager.camera.position.distanceTo(initial) > 0.1, 'camera input recovers with the viewport')
    assert.ok(manager.camera.position.toArray().every(Number.isFinite))
  } finally { manager.dispose() }
})
