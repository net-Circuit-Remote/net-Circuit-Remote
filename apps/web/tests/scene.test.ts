import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSceneManager, type SceneRenderer } from '../src/three/SceneManager'
import { InstancedMesh, Vector3 } from 'three'
import { buildComponent, disposeObject } from '../src/three/ComponentModel'
import type { CircuitGraph } from '../src/types/circuit'

test('structure disposal releases instance buffers, not only geometry and material', () => {
  const board = buildComponent({ id: 'board', type: 'BREADBOARD' })
  let buffers = 0
  board.traverse((object) => { if (object instanceof InstancedMesh) object.addEventListener('dispose', () => buffers++) })
  disposeObject(board)
  assert.equal(buffers, 1)
})

test('placement reuses the ghost while moving; cancel removes it and releases its buffers', () => {
  const manager = createSceneManager({ renderer: { setSize() {}, render() {}, dispose() {} }, requestFrame: () => 1, cancelFrame() {} })
  manager.setGhost('BREADBOARD', new Vector3(0, 0, 0))
  const ghost = manager.scene.children.find((object) => object.userData.id === 'PLACE')!
  let released = 0
  ghost.traverse((object) => { if (object instanceof InstancedMesh) object.addEventListener('dispose', () => released++) })
  manager.setGhost('BREADBOARD', new Vector3(2, 0, 1))
  assert.equal(manager.scene.children.find((object) => object.userData.id === 'PLACE')?.uuid, ghost.uuid)
  assert.deepEqual(ghost.position.toArray(), [2, 0, 1])
  manager.setGhost(null)
  assert.equal(released, 1)
  assert.equal(manager.scene.children.includes(ghost), false)
  manager.dispose()
})

test('scene reconciles by module ID, previews without changing graph and disposes removed models/wires', () => {
  const manager = createSceneManager({ renderer: { setSize() {}, render() {}, dispose() {} }, requestFrame: () => 1, cancelFrame() {} })
  const graph: CircuitGraph = { schema_version: '1.0', circuit_id: 'test', modules: [{ id: 'A', type: 'DIGITAL_SWITCH', position: { x: -2, y: 0, z: 0 } }, { id: 'B', type: 'LED', position: { x: 2, y: 0, z: 0 } }], connections: [{ source: 'A.OUT', destination: 'B.IN' }] }
  manager.syncGraph(graph)
  const model = manager.models.get('A')!
  const snapshot = JSON.stringify(graph)
  const before = manager.endpointPosition('A.OUT')!
  manager.previewMove('A', { x: -1, y: 0, z: 1 })
  assert.equal(JSON.stringify(graph), snapshot)
  assert.ok(manager.endpointPosition('A.OUT')!.distanceTo(before.clone().add(new Vector3(1, 0, 1))) < 0.001)
  manager.syncGraph(graph)
  assert.equal(manager.models.get('A'), model)
  assert.ok(manager.endpointPosition('A.OUT')!.distanceTo(before) < 0.001)
  assert.equal(manager.wires.children.length, 1)
  let disposed = 0
  model.traverse((object) => { if ('geometry' in object) (object.geometry as { addEventListener(type: string, callback: () => void): void }).addEventListener('dispose', () => disposed++) })
  manager.syncGraph({ ...graph, modules: [graph.modules[1]], connections: [] })
  assert.equal(manager.models.has('A'), false)
  assert.ok(disposed > 0)
  assert.equal(manager.wires.children.length, 0)
  manager.dispose()
})

test('named endpoint anchors rotate with geometry; screen picking and ground projection use camera only', () => {
  const manager = createSceneManager({ renderer: { setSize() {}, render() {}, dispose() {} }, requestFrame: () => 1, cancelFrame() {} })
  manager.resize(1000, 700)
  manager.syncGraph({ schema_version: '1.0', circuit_id: 'test', modules: [{ id: 'S', type: 'DIGITAL_SWITCH', position: { x: 0, y: 0, z: 0 }, rotation: 90 }], connections: [] })
  const anchor = manager.endpointPosition('S.OUT')!
  assert.ok(Math.abs(anchor.x) < 0.001)
  assert.ok(anchor.z < 0)
  const screen = manager.project(anchor)
  assert.equal(manager.pick(screen.x, screen.y)?.kind, 'port')
  const ground = manager.groundPoint(500, 350)!
  assert.ok(Math.abs(ground.x) < 0.001 && Math.abs(ground.z) < 0.001)
  manager.dispose()
})

test('scene coalesces renders, ignores zero sizes and disposes all owned resources', () => {
  let nextId = 0
  const frames = new Map<number, FrameRequestCallback>()
  const calls: string[] = []
  const renderer: SceneRenderer = {
    setSize: (w, h) => { calls.push(`size ${w} ${h}`) },
    render: () => { calls.push('render') },
    dispose: () => { calls.push('dispose') },
  }
  const manager = createSceneManager({ renderer, requestFrame: (callback) => { frames.set(++nextId, callback); return nextId }, cancelFrame: (id) => { frames.delete(id) } })
  let geometryDisposed = false
  let materialDisposed = false
  manager.grid.geometry.addEventListener('dispose', () => { geometryDisposed = true })
  const materials = Array.isArray(manager.grid.material) ? manager.grid.material : [manager.grid.material]
  materials[0].addEventListener('dispose', () => { materialDisposed = true })
  manager.resize(0, 0)
  assert.equal(frames.size, 0)
  manager.resize(1200, 600)
  manager.setZoom(150)
  manager.resize(1200, 600)
  assert.equal(frames.size, 1)
  const [id, callback] = [...frames][0]
  frames.delete(id); callback(0)
  assert.equal(calls.filter((call) => call === 'render').length, 1)
  manager.setZoom(100)
  manager.dispose()
  manager.dispose()
  assert.equal(frames.size, 0)
  assert.equal(calls.filter((call) => call === 'dispose').length, 1)
  assert.equal(geometryDisposed, true)
  assert.equal(materialDisposed, true)
  manager.resize(500, 500)
  manager.setZoom(200)
  assert.equal(frames.size, 0)
})

test('keyboard view controls orbit and pan without touching graph; reset restores camera', () => {
  const manager = createSceneManager({ renderer: { setSize() {}, render() {}, dispose() {} }, requestFrame: () => 1, cancelFrame() {} })
  const initial = manager.camera.position.clone()
  manager.orbit(15)
  assert.ok(manager.camera.position.distanceTo(initial) > 1)
  assert.ok(Math.abs(manager.camera.position.length() - initial.length()) < 0.001)
  const orbit = manager.camera.position.clone()
  manager.pan(1, 0)
  assert.ok(manager.camera.position.distanceTo(orbit) > 0.9)
  manager.resetView()
  assert.ok(manager.camera.position.distanceTo(initial) < 0.001)
  manager.dispose()
})

test('thin wires have a picking margin for normal pointer precision', () => {
  const manager = createSceneManager({ renderer: { setSize() {}, render() {}, dispose() {} }, requestFrame: () => 1, cancelFrame() {} })
  manager.resize(1000, 700)
  manager.syncGraph({ schema_version: '1.0', circuit_id: 'wire', modules: [{ id: 'A', type: 'CLOCK', position: { x: -2, y: 0, z: 0 } }, { id: 'B', type: 'LED', position: { x: 2, y: 0, z: 0 } }], connections: [{ source: 'A.OUT', destination: 'B.IN' }] })
  const a = manager.endpointPosition('A.OUT')!, b = manager.endpointPosition('B.IN')!
  const middle = a.clone().add(b).multiplyScalar(0.5); middle.y += Math.min(1.2, a.distanceTo(b) * 0.2 + 0.3) / 2
  const point = manager.project(middle)
  assert.equal(manager.pick(point.x, point.y + 4)?.kind, 'wire')
  manager.dispose()
})

test('axis directions follow camera orientation, ignore translation and reset with the view', () => {
  const manager = createSceneManager({ renderer: { setSize() {}, render() {}, dispose() {} }, requestFrame: () => 1, cancelFrame() {} })
  try {
    const read = () => (manager as typeof manager & { orientationAxes?: () => { label: string; x: number; y: number; depth: number }[] }).orientationAxes?.()
    const initial = read()
    assert.ok(initial, 'scene must expose camera-oriented world axes')
    const x = initial.find((axis) => axis.label === 'X')!
    assert.ok(Math.abs(x.x - 1) < 0.001 && Math.abs(x.y) < 0.001)
    manager.orbit(90)
    const orbit = read()!
    assert.ok(Math.abs(orbit.find((axis) => axis.label === 'X')!.x) < 0.001)
    assert.ok(Math.abs(orbit.find((axis) => axis.label === 'Z')!.x) > 0.99)
    manager.pan(2, 3); manager.setZoom(160)
    for (const axis of orbit) {
      const panned = read()!.find((item) => item.label === axis.label)!
      assert.ok(Math.abs(axis.x - panned.x) < 0.001 && Math.abs(axis.y - panned.y) < 0.001)
    }
    manager.resetView()
    for (const axis of initial) {
      const reset = read()!.find((item) => item.label === axis.label)!
      assert.ok(Math.abs(axis.x - reset.x) < 0.001 && Math.abs(axis.y - reset.y) < 0.001)
    }
  } finally { manager.dispose() }
})

test('right-button OrbitControls pointer drag redraws axes, including after a left gesture lock', () => {
  const root = new EventTarget(), capture = new Set<number>()
  const canvas = Object.assign(new EventTarget(), {
    style: { touchAction: '' }, clientWidth: 1000, clientHeight: 700,
    getRootNode: () => root, setPointerCapture: (id: number) => capture.add(id), releasePointerCapture: (id: number) => capture.delete(id),
  })
  let frame: FrameRequestCallback | undefined, renders = 0
  let renderedX = 1
  const manager = createSceneManager({ canvas: canvas as unknown as HTMLCanvasElement, renderer: { setSize() {}, render() {}, dispose() {} },
    requestFrame: (callback) => { frame = callback; return 1 }, cancelFrame: () => { frame = undefined },
    onRender: () => { renders++; renderedX = manager.orientationAxes().find((axis) => axis.label === 'X')!.x },
  })
  const pointer = (type: string, button: number, x: number, y: number) => canvas.dispatchEvent(Object.assign(new Event(type), { button, pointerId: 1, pointerType: 'mouse', clientX: x, clientY: y }))
  try {
    manager.resize(1000, 700); frame?.(0)
    manager.lockPointer(true)
    const before = manager.camera.quaternion.clone()
    pointer('pointerdown', 2, 500, 350); pointer('pointermove', 2, 650, 420); pointer('pointerup', 2, 650, 420)
    assert.ok(manager.camera.quaternion.angleTo(before) < 0.0001)
    manager.lockPointer(false)
    pointer('pointerdown', 2, 500, 350); pointer('pointermove', 2, 650, 420); pointer('pointerup', 2, 650, 420)
    assert.ok(manager.camera.quaternion.angleTo(before) > 0.2)
    frame?.(0)
    assert.ok(renderedX < 0.5)
    assert.equal(renders, 2)
    assert.equal(capture.size, 0)
    manager.resetView(); frame?.(0)
    assert.ok(Math.abs(renderedX - 1) < 0.001)
  } finally { manager.dispose() }
})
