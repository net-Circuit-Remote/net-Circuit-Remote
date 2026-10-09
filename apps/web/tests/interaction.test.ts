import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRenderer, nextTick, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { Vector3 } from 'three'
import { useCircuitEditor } from '../src/composables/useCircuitEditor'
import { useCircuitStore } from '../src/stores/circuit'
import { useWorkspaceStore, type WorkspaceTool } from '../src/stores/workspace'
import { createSceneManager } from '../src/three/SceneManager'

// Only the DOM/canvas host and GPU boundary are replaced; picking, camera math,
// Vue lifecycle, graph commands and history use the production implementations.
function setup(tool: WorkspaceTool = 'select') {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document')
  const documentHost = Object.assign(new EventTarget(), { createElement: () => ({ getContext: () => null }) })
  Object.defineProperty(globalThis, 'document', { configurable: true, value: documentHost })
  setActivePinia(createPinia())
  const circuit = useCircuitStore(), workspace = useWorkspaceStore()
  workspace.setTool(tool)
  circuit.createDraft(); circuit.past = []
  const captured = new Set<number>()
  const canvas = ref({
    focus() {}, getBoundingClientRect: () => ({ left: 0, top: 0 }),
    setPointerCapture: (id: number) => captured.add(id),
    hasPointerCapture: (id: number) => captured.has(id),
    releasePointerCapture: (id: number) => captured.delete(id),
  } as unknown as HTMLCanvasElement)
  const manager = createSceneManager({ renderer: { setSize() {}, render() {}, dispose() {} }, requestFrame: () => 1, cancelFrame() {} })
  manager.resize(1000, 700)
  const renderer = createRenderer<object, object>({
    insert() {}, remove() {}, createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
    setText() {}, setElementText() {}, parentNode: () => null, nextSibling: () => null, patchProp() {},
  })
  let editor!: ReturnType<typeof useCircuitEditor>
  const app = renderer.createApp({ setup() { editor = useCircuitEditor(canvas, () => manager); return () => null } })
  app.mount({})
  const pointer = (x: number, y: number, pointerId = 1, button = 0) => ({ clientX: x, clientY: y, pointerId, button, preventDefault() {} } as PointerEvent)
  return { circuit, workspace, manager, editor, captured, pointer, dispose() {
    app.unmount(); manager.dispose()
    if (previous) Object.defineProperty(globalThis, 'document', previous)
    else Reflect.deleteProperty(globalThis, 'document')
  } }
}

test('Move left drag moves a breadboard, previews without graph mutation and commits one undo', async () => {
  const h = setup('move')
  try {
    const original = { x: 0.13, y: 0.25, z: 0.19 }
    const id = h.circuit.placeModule('BREADBOARD', original)
    await nextTick(); h.circuit.past = []
    const start = h.manager.project(new Vector3(original.x, original.y + 0.12, original.z))
    assert.equal(h.manager.pick(start.x, start.y)?.kind, 'module')
    h.editor.pointerDown(h.pointer(start.x, start.y))
    h.editor.pointerMove(h.pointer(start.x + 80, start.y + 55))
    assert.ok(h.manager.models.get(id)!.position.distanceTo(new Vector3(original.x, original.y, original.z)) > 0.5)
    assert.deepEqual(h.circuit.graph!.modules[0].position, original)
    h.editor.pointerMove(h.pointer(start.x + 120, start.y + 65))
    h.editor.pointerUp(h.pointer(start.x + 120, start.y + 65))
    assert.equal(h.circuit.past.length, 1)
    assert.equal(h.circuit.graph!.modules[0].position!.y, original.y)
    assert.equal(h.captured.size, 0)
    h.circuit.undo(); assert.deepEqual(h.circuit.graph!.modules[0].position, original)
    h.circuit.redo(); assert.notDeepEqual(h.circuit.graph!.modules[0].position, original)
  } finally { h.dispose() }
})

test('left drag of empty surface grabs the XZ plane after orbit without graph/history changes', () => {
  const h = setup()
  try {
    h.manager.orbit(70)
    const before = h.manager.camera.position.clone(), rotation = h.manager.camera.quaternion.clone()
    const grabbed = h.manager.groundPoint(300, 450)!
    const graph = JSON.stringify(h.circuit.graph)
    h.editor.pointerDown(h.pointer(300, 450))
    h.editor.pointerMove(h.pointer(400, 480))
    h.editor.pointerMove(h.pointer(460, 510))
    h.editor.pointerUp(h.pointer(460, 510))
    assert.ok(h.manager.camera.position.distanceTo(before) > 1)
    assert.ok(h.manager.groundPoint(460, 510)!.distanceTo(grabbed) < 0.0001)
    assert.ok(h.manager.camera.quaternion.angleTo(rotation) < 0.0001)
    assert.equal(h.manager.camera.position.y, before.y)
    assert.equal(JSON.stringify(h.circuit.graph), graph)
    assert.equal(h.circuit.past.length, 0)
    assert.equal(h.captured.size, 0)
  } finally { h.dispose() }
})

test('click/jitter on an unsnapped model does not snap it or record history', async () => {
  const h = setup('move')
  try {
    const original = { x: 0.13, y: 0, z: 0.19 }
    const id = h.circuit.placeModule('BREADBOARD', original)
    await nextTick(); h.circuit.past = []
    const p = h.manager.project(new Vector3(original.x, 0.12, original.z))
    h.editor.pointerDown(h.pointer(p.x, p.y))
    h.editor.pointerMove(h.pointer(p.x + 1, p.y + 1))
    h.editor.pointerUp(h.pointer(p.x + 1, p.y + 1))
    assert.equal(h.workspace.selectedModuleId, id)
    assert.deepEqual(h.circuit.graph!.modules[0].position, original)
    assert.equal(h.circuit.past.length, 0)
  } finally { h.dispose() }
})

test('cancelled model drag releases capture and restores geometry without changing wires', async () => {
  const h = setup('move')
  try {
    const id = h.circuit.placeModule('DIGITAL_SWITCH', { x: 0, y: 0, z: 0 })
    const led = h.circuit.placeModule('LED', { x: 4, y: 0, z: 0 })
    h.circuit.connectPorts(`${id}.OUT`, `${led}.IN`)
    await nextTick(); h.circuit.past = []
    const graph = JSON.stringify(h.circuit.graph)
    const p = h.manager.project(new Vector3(0, 0.15, 0))
    h.editor.pointerDown(h.pointer(p.x, p.y))
    h.editor.pointerMove(h.pointer(p.x + 100, p.y + 50))
    assert.ok(h.manager.models.get(id)!.position.length() > 0.5)
    h.editor.cancel()
    assert.deepEqual(h.manager.models.get(id)!.position.toArray(), [0, 0, 0])
    assert.equal(JSON.stringify(h.circuit.graph), graph)
    assert.equal(h.circuit.past.length, 0)
    assert.equal(h.captured.size, 0)
  } finally { h.dispose() }
})

test('pan preserves selection/pending wire; a blank click clears them without moving the camera', async () => {
  const h = setup()
  try {
    const id = h.circuit.placeModule('CLOCK', { x: 0, y: 0, z: 0 })
    await nextTick(); h.circuit.past = []
    h.workspace.setTool('wire'); h.workspace.selectModule(id); h.workspace.pendingPort = `${id}.OUT`
    await nextTick()
    h.editor.pointerDown(h.pointer(200, 520)); h.editor.pointerMove(h.pointer(250, 560)); h.editor.pointerUp(h.pointer(250, 560))
    assert.equal(h.workspace.selectedModuleId, id)
    assert.equal(h.workspace.pendingPort, `${id}.OUT`)
    const camera = h.manager.camera.position.clone()
    h.editor.pointerDown(h.pointer(200, 520)); h.editor.pointerUp(h.pointer(200, 520))
    assert.equal(h.workspace.selectedModuleId, null)
    assert.equal(h.workspace.pendingPort, null)
    assert.ok(h.manager.camera.position.distanceTo(camera) < 0.0001)
    assert.equal(h.circuit.past.length, 0)
  } finally { h.dispose() }
})

test('only the captured pointer can move/finish a model; changing tools cancels its preview', async () => {
  const h = setup('move')
  try {
    const id = h.circuit.placeModule('BREADBOARD', { x: 0, y: 0, z: 0 })
    await nextTick(); h.circuit.past = []
    const p = h.manager.project(new Vector3(0, 0.12, 0))
    h.editor.pointerDown(h.pointer(p.x, p.y))
    h.editor.pointerMove(h.pointer(p.x + 100, p.y + 50, 2)); h.editor.pointerUp(h.pointer(p.x + 100, p.y + 50, 2))
    assert.deepEqual(h.manager.models.get(id)!.position.toArray(), [0, 0, 0])
    assert.equal(h.captured.size, 1)
    h.editor.pointerMove(h.pointer(p.x + 100, p.y + 50))
    assert.ok(h.manager.models.get(id)!.position.length() > 0.5)
    h.workspace.setTool('select'); await nextTick()
    assert.deepEqual(h.manager.models.get(id)!.position.toArray(), [0, 0, 0])
    assert.equal(h.captured.size, 0)
    h.editor.pointerUp(h.pointer(p.x + 100, p.y + 50))
    assert.equal(h.circuit.past.length, 0)
  } finally { h.dispose() }
})

test('Wire and Rotate tools keep their click actions instead of starting a model drag', async () => {
  const h = setup()
  try {
    const id = h.circuit.placeModule('DIGITAL_SWITCH', { x: 0, y: 0, z: 0 })
    await nextTick(); h.circuit.past = []
    h.workspace.setTool('wire'); await nextTick()
    const port = h.manager.project(h.manager.endpointPosition(`${id}.OUT`)!)
    h.editor.pointerDown(h.pointer(port.x, port.y))
    assert.equal(h.workspace.pendingPort, `${id}.OUT`)
    assert.equal(h.captured.size, 0)
    h.workspace.setTool('rotate'); await nextTick()
    const body = h.manager.project(new Vector3(0, 0.15, 0))
    h.editor.pointerDown(h.pointer(body.x, body.y)); h.editor.pointerMove(h.pointer(body.x + 100, body.y + 50)); h.editor.pointerUp(h.pointer(body.x + 100, body.y + 50))
    assert.equal(h.circuit.graph!.modules[0].rotation, 90)
    assert.deepEqual(h.circuit.graph!.modules[0].position, { x: 0, y: 0, z: 0 })
    assert.equal(h.circuit.past.length, 1)
    assert.equal(h.captured.size, 0)
  } finally { h.dispose() }
})

test('a visible model can be dragged at a low orbit angle even when its ray misses the ground', async () => {
  const h = setup('move')
  try {
    const id = h.circuit.placeModule('LED', { x: 0, y: 0, z: 0 })
    await nextTick(); h.circuit.past = []
    h.manager.camera.position.set(0, 3 * Math.cos(Math.PI / 2 - 0.05), 3 * Math.sin(Math.PI / 2 - 0.05))
    h.manager.camera.lookAt(0, 0, 0)
    const p = h.manager.project(new Vector3(0, 0.45, 0))
    assert.equal(p.visible, true)
    assert.equal(h.manager.pick(p.x, p.y)?.kind, 'module')
    assert.equal(h.manager.groundPoint(p.x, p.y), null)
    h.editor.pointerDown(h.pointer(p.x, p.y))
    assert.equal(h.captured.size, 1)
    h.editor.pointerMove(h.pointer(p.x + 180, p.y))
    assert.ok(h.manager.models.get(id)!.position.length() >= 0.5)
    h.editor.pointerUp(h.pointer(p.x + 180, p.y))
    assert.equal(h.circuit.past.length, 1)
    assert.equal(h.circuit.graph!.modules[0].position!.y, 0)
  } finally { h.dispose() }
})

test('Select picks breadboards and other models without dragging geometry, camera or history', async () => {
  for (const type of ['BREADBOARD', 'LED']) {
    const h = setup()
    try {
      const original = { x: 0, y: 0, z: 0 }
      const id = h.circuit.placeModule(type, original)
      await nextTick(); h.circuit.past = []
      const camera = h.manager.camera.position.clone()
      const p = h.manager.project(new Vector3(0, type === 'LED' ? 0.45 : 0.12, 0))
      assert.equal(h.manager.pick(p.x, p.y)?.kind, 'module')
      h.editor.pointerDown(h.pointer(p.x, p.y))
      h.editor.pointerMove(h.pointer(p.x + 100, p.y + 50))
      assert.equal(h.workspace.selectedModuleId, id)
      assert.deepEqual(h.manager.models.get(id)!.position.toArray(), [0, 0, 0])
      h.editor.pointerUp(h.pointer(p.x + 100, p.y + 50))
      assert.deepEqual(h.circuit.graph!.modules[0].position, original)
      assert.ok(h.manager.camera.position.distanceTo(camera) < 0.0001)
      assert.equal(h.captured.size, 0)
      assert.equal(h.circuit.past.length, 0)
    } finally { h.dispose() }
  }
})
