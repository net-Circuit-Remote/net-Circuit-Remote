import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Box3, Group, Mesh, MeshBasicMaterial, PlaneGeometry, Vector3 } from 'three'
import { createPinia, setActivePinia } from 'pinia'
import { buildComponent, disposeObject } from '../src/three/ComponentModel'
import { getDefinition } from '../src/data/editorCatalog'
import { ribbonGroups } from '../src/data/ribbon'
import { useCircuitStore } from '../src/stores/circuit'
import { createSceneManager } from '../src/three/SceneManager'
import { readFile } from 'node:fs/promises'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Texture } from 'three'

const knobs = ['time_div_knob', 'horizontal_position', 'trigger_level', 'ch1_volts_div', 'ch1_position', 'ch2_volts_div', 'ch2_position']
const buttons = ['run_stop_button', 'auto_set_button', 'single_button', 'trigger_source_button', 'trigger_mode_button', 'trigger_slope_button']

test('two-channel scope is placeable from Instruments, with no fabricated electrical/acquisition contract', () => {
  const definition = getDefinition('OSCILLOSCOPE')
  assert.ok(definition, 'Oscilloscope must have an editor definition')
  assert.equal(definition.family, 'instruments'); assert.equal(definition.visualOnly, true)
  assert.deepEqual(definition.ports, []); assert.deepEqual(definition.parameters, [])
  const item = ribbonGroups.find((g) => g.id === 'instruments')!.items.find((i) => i.type === 'OSCILLOSCOPE')!
  assert.equal(item.window, undefined, 'palette selection places the model')
  setActivePinia(createPinia())
  const store = useCircuitStore(); store.createDraft()
  const id = store.placeModule('OSCILLOSCOPE', { x: 2, y: 0, z: -1 })
  store.moveModule(id, { x: 4, y: 0, z: 3 }); store.rotateModule(id)
  assert.equal(store.graph!.modules[0].rotation, 90)
  store.undo(); store.undo(); assert.deepEqual(store.graph!.modules[0].position, { x: 2, y: 0, z: -1 })
  assert.deepEqual(store.graph!.connections, [])
})

test('scope has centered local knob pivots, independent screen, exactly two BNCs and a bounded mesh budget', () => {
  const model = buildComponent({ id: 'SCOPE', type: 'OSCILLOSCOPE' })
  try {
    for (const name of knobs) {
      const pivot = model.getObjectByName(name)
      assert.ok(pivot instanceof Group, name)
      const body = pivot.getObjectByName(`${name}_body`) as Mesh
      assert.ok(body instanceof Mesh)
      assert.equal(body.position.x, 0); assert.equal(body.position.y, 0)
      const before = body.getWorldPosition(new Vector3())
      pivot.rotation.z = 0.6; model.updateMatrixWorld(true)
      assert.ok(body.getWorldPosition(new Vector3()).distanceTo(before) < 1e-8, 'turning a knob must not orbit its center')
    }
    for (const name of buttons) assert.ok(model.getObjectByName(name), name)
    const screen = model.getObjectByName('screen') as Mesh
    assert.ok(screen.geometry instanceof PlaneGeometry)
    assert.ok(screen.material instanceof MeshBasicMaterial && !screen.material.toneMapped)
    assert.ok(model.getObjectByName('brand_owl')); assert.ok(model.getObjectByName('front_legends'))
    let bnc = 0, triangles = 0, meshes = 0
    model.traverse((node) => {
      if (/^ch[12]_bnc$/.test(node.name)) bnc++
      if (node instanceof Mesh) { meshes++; triangles += (node.geometry.index?.count ?? node.geometry.getAttribute('position').count) / 3 }
    })
    assert.equal(bnc, 2)
    assert.ok(triangles < 25000, `${triangles} triangles`); assert.ok(meshes < 100, `${meshes} meshes`)
    const bounds = new Box3().setFromObject(model)
    assert.ok(Math.abs(bounds.min.y) < 0.001, 'origin sits on the work surface')
    assert.ok(bounds.max.y <= getDefinition('OSCILLOSCOPE')!.size[1] + 0.01)
    assert.ok(Math.abs(bounds.min.x + bounds.max.x) < 0.01, 'base centered on X')
    assert.deepEqual(model.position.toArray(), [0, 0, 0]); assert.deepEqual(model.scale.toArray(), [1, 1, 1])
  } finally { disposeObject(model) }
})

test('scope participates in the existing selected-object transform gizmo after graph movement/yaw', () => {
  const manager = createSceneManager({ renderer: { setSize() {}, render() {}, dispose() {} }, requestFrame: () => 1, cancelFrame() {} })
  try {
    manager.resize(1000, 700)
    manager.syncGraph({ schema_version: '1.0', circuit_id: 'scope', modules: [{ id: 'SCOPE', type: 'OSCILLOSCOPE', position: { x: 3, y: 0, z: 2 }, rotation: 45 }], connections: [] })
    manager.highlight('SCOPE')
    assert.ok(manager.gizmoHandlePosition('xz')); assert.ok(manager.gizmoHandlePosition('rotate-y'))
    const model = manager.models.get('SCOPE')!
    assert.ok(model.getObjectByName('screen'))
    assert.deepEqual(model.position.toArray(), [3, 0, 2]); assert.equal(model.rotation.y, Math.PI / 4)
  } finally { manager.dispose() }
})

test('delivered GLB and glTF round-trip through GLTFLoader with all controls and embedded PNGs', async () => {
  const folder = new URL('../public/models/oscilloscope-2ch/', import.meta.url)
  const bytes = await readFile(new URL('oscilloscope-2ch.glb', folder))
  assert.equal(bytes.readUInt32LE(0), 0x46546c67); assert.equal(bytes.readUInt32LE(4), 2)
  assert.equal(bytes.readUInt32LE(8), bytes.length)
  assert.ok(bytes.length < 1500000, 'WebGL asset stays below 1.5 MB')
  const jsonLength = bytes.readUInt32LE(12)
  const glb = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString())
  const bin = bytes.subarray(28 + jsonLength)
  for (const view of glb.bufferViews) assert.ok(view.byteOffset + view.byteLength <= bin.length)
  assert.equal(glb.images.length, 3)
  for (const image of glb.images) {
    assert.equal(image.mimeType, 'image/png'); assert.equal(image.uri, undefined)
    const view = glb.bufferViews[image.bufferView]
    assert.equal(bin.subarray(view.byteOffset, view.byteOffset + 8).toString('hex'), '89504e470d0a1a0a')
  }
  const gltf = JSON.parse(await readFile(new URL('oscilloscope-2ch.gltf', folder), 'utf8'))
  const binary = await readFile(new URL(gltf.buffers[0].uri, folder))
  assert.equal(binary.length, gltf.buffers[0].byteLength)
  for (const image of gltf.images) assert.ok((await readFile(new URL(image.uri, folder))).length > 0)
  gltf.buffers[0].uri = `data:application/octet-stream;base64,${binary.toString('base64')}`
  // Node has no GPU/image decoder: validate PNG payloads above, then use the real
  // Three loader for geometry, material slots, transforms and node hierarchy.
  const progress = Object.getOwnPropertyDescriptor(globalThis, 'ProgressEvent')
  if (!progress) Object.defineProperty(globalThis, 'ProgressEvent', { configurable: true, value: class extends Event { constructor(type: string, init: ProgressEventInit) { super(type); Object.assign(this, init) } } })
  const loader = new GLTFLoader().register(() => ({ name: 'TEST_PNG_DECODER', loadTexture: () => Promise.resolve(new Texture()) }))
  try { for (const input of [bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), JSON.stringify(gltf)]) {
    const loaded = await loader.parseAsync(input, '')
    try {
      const root = loaded.scene.getObjectByName('net_circuit_oscilloscope_2ch')!
      assert.ok(root); assert.deepEqual(root.position.toArray(), [0, 0, 0]); assert.deepEqual(root.scale.toArray(), [1, 1, 1])
      for (const name of [...knobs, ...buttons, 'screen', 'ch1_bnc', 'ch2_bnc']) assert.ok(root.getObjectByName(name), name)
      const screen = root.getObjectByName('screen') as Mesh<any, MeshBasicMaterial>
      assert.ok(screen.material instanceof MeshBasicMaterial); assert.ok(screen.material.map)
      const positions = screen.geometry.getAttribute('position'), uv = screen.geometry.getAttribute('uv')
      for (let i = 0; i < positions.count; i++) assert.equal(uv.getY(i), positions.getY(i) > 0 ? 0 : 1, 'exported image top maps to the top of the screen')
      for (const name of knobs) {
        const pivot = root.getObjectByName(name)!, body = root.getObjectByName(`${name}_body`)!
        assert.equal(body.parent, pivot); assert.deepEqual(body.position.toArray(), [0, 0, 0])
      }
    } finally { disposeObject(loaded.scene) }
  } } finally { if (!progress) Reflect.deleteProperty(globalThis, 'ProgressEvent') }
})
