import { readFile } from 'node:fs/promises'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Texture } from 'three'
import { generatorScreenArtwork, generatorLegendsArtwork, instrumentArtworkSvg } from '../src/three/FunctionGeneratorArtwork'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Box3, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, Vector3 } from 'three'
import { createPinia, setActivePinia } from 'pinia'
import { buildComponent, disposeObject } from '../src/three/ComponentModel'
import { getDefinition } from '../src/data/editorCatalog'
import { ribbonGroups } from '../src/data/ribbon'
import { useCircuitStore } from '../src/stores/circuit'
import { createSceneManager } from '../src/three/SceneManager'

const keys = ['waveform_button', 'sweep_button', 'vco_button', 'counter_button', 'system_button', 'utility_button', 'ch1_button', 'ok_button', 'ch2_button']
export const generatorNodes = ['screen', 'encoder_knob', 'power_button', 'tilt_stand', 'brand_owl', 'front_legends', 'encoder_led_arc', ...keys, 'left_button', 'right_button', ...Array.from({ length: 6 }, (_, i) => `soft_key_${i + 1}`), 'ch1_output', 'ch2_output', 'sync_counter']

test('two-channel generator is placeable and uses existing transform history without electrical ports', () => {
  const definition = getDefinition('GENERATOR')
  assert.ok(definition)
  assert.equal(definition.visualOnly, true); assert.deepEqual(definition.ports, []); assert.deepEqual(definition.parameters, [])
  assert.deepEqual(definition.size, [6, 3.6, 2.8])
  assert.equal(ribbonGroups.find(g => g.id === 'instruments')!.items.find(i => i.type === 'GENERATOR')!.window, undefined)
  setActivePinia(createPinia()); const store = useCircuitStore(); store.createDraft()
  const id = store.placeModule('GENERATOR', { x: 2, y: 0, z: -1 })
  store.moveModule(id, { x: 4, y: 0, z: 3 }); store.rotateModule(id)
  assert.equal(store.graph!.modules[0].rotation, 90)
  store.undo(); store.undo(); assert.deepEqual(store.graph!.modules[0].position, { x: 2, y: 0, z: -1 })
  assert.deepEqual(store.graph!.connections, [])
})

test('generator preserves reference control layout, independent screen, encoder pivot, stand and realtime budget', () => {
  const model = buildComponent({ id: 'FG', type: 'GENERATOR' })
  try {
    assert.equal(model.name, 'net_circuit_function_generator_2ch')
    for (const name of generatorNodes) assert.ok(model.getObjectByName(name), name)
    const screen = model.getObjectByName('screen') as Mesh
    assert.ok(screen.geometry instanceof PlaneGeometry)
    assert.ok(screen.material instanceof MeshBasicMaterial && !screen.material.toneMapped)
    const screenBounds = new Box3().setFromObject(screen)
    const soft = Array.from({ length: 6 }, (_, i) => model.getObjectByName(`soft_key_${i + 1}`)!)
    soft.forEach((key, i) => {
      assert.equal(key.position.x, soft[0].position.x); assert.ok(key.position.x > screenBounds.max.x)
      if (i) assert.ok(key.position.y < soft[i - 1].position.y)
      const led = model.getObjectByName(`${key.name}_led`) as Mesh
      assert.ok(led.material instanceof MeshBasicMaterial && !led.material.toneMapped)
    })
    keys.forEach((name, i) => {
      const key = model.getObjectByName(name)!
      if (i < 6) {
        assert.equal(key.position.x, model.getObjectByName(keys[i % 3])!.position.x)
        assert.equal(key.position.y, model.getObjectByName(keys[Math.floor(i / 3) * 3])!.position.y)
      } else {
        assert.equal(key.position.y, model.getObjectByName('ch1_button')!.position.y)
      }
    })
    assert.equal(model.getObjectByName('ok_button')!.position.x, (model.getObjectByName('ch1_button')!.position.x + model.getObjectByName('ch2_button')!.position.x) / 2)
    assert.ok(model.getObjectByName('ch1_button')!.position.x < model.getObjectByName('ok_button')!.position.x)
    assert.ok(model.getObjectByName('ch2_button')!.position.x > model.getObjectByName('ok_button')!.position.x)
    for (const name of ['ch1_button_led', 'ch2_button_led']) assert.ok(model.getObjectByName(name))
    const powerLight = model.getObjectByName('power_button_light') as Mesh
    assert.ok(powerLight.material instanceof MeshBasicMaterial && !powerLight.material.toneMapped, 'power ring remains illuminated independently of scene lighting')
    const encoder = model.getObjectByName('encoder_knob')!, body = model.getObjectByName('encoder_knob_body')!
    assert.ok(encoder instanceof Group); assert.equal(body.parent, encoder); assert.deepEqual(body.position.toArray(), [0, 0, 0])
    const before = body.getWorldPosition(new Vector3()); encoder.rotation.z = 0.7; model.updateMatrixWorld(true)
    assert.ok(body.getWorldPosition(new Vector3()).distanceTo(before) < 1e-8)
    const ports = ['ch1_output', 'ch2_output', 'sync_counter'].map(name => model.getObjectByName(name)!)
    ports.forEach(port => { assert.equal(port.position.y, ports[0].position.y); assert.ok(port.position.y < screenBounds.min.y) })
    assert.equal(ports[2].userData.role, 'sync-counter'); assert.equal(ports[2].userData.channel, undefined)
    const material = (model.getObjectByName('enclosure') as Mesh).material as MeshStandardMaterial
    assert.equal(material.color.getHexString(), 'a1aab4'); assert.ok(material.roughness >= 0.45)
    const bounds = new Box3().setFromObject(model)
    assert.ok(Math.abs(bounds.min.y) < 0.001); assert.ok(bounds.max.y <= 3.61)
    let meshes = 0, triangles = 0
    model.traverse(node => { if (node instanceof Mesh) { meshes++; triangles += (node.geometry.index?.count ?? node.geometry.attributes.position.count) / 3 } })
    assert.ok(meshes < 100, `${meshes} meshes`); assert.ok(triangles < 20000, `${triangles} triangles`)
  } finally { disposeObject(model) }
})

test('generator supports selected-object gizmo after graph movement and yaw', () => {
  const manager = createSceneManager({ renderer: { setSize() {}, render() {}, dispose() {} }, requestFrame: () => 1, cancelFrame() {} })
  try {
    manager.resize(1000, 700)
    manager.syncGraph({ schema_version: '1.0', circuit_id: 'fg', modules: [{ id: 'FG', type: 'GENERATOR', position: { x: 2, y: 0, z: 1 }, rotation: 45 }], connections: [] })
    manager.highlight('FG'); assert.ok(manager.gizmoHandlePosition('xz')); assert.ok(manager.gizmoHandlePosition('rotate-y'))
    assert.ok(manager.models.get('FG')!.getObjectByName('encoder_knob'))
  } finally { manager.dispose() }
})

test('delivered GLB and glTF round-trip through GLTFLoader with all controls and embedded PNGs', async () => {
  const folder = new URL('../public/models/function-generator-2ch/', import.meta.url)
  const bytes = await readFile(new URL('function-generator-2ch.glb', folder))
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
  const gltf = JSON.parse(await readFile(new URL('function-generator-2ch.gltf', folder), 'utf8'))
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
      const root = loaded.scene.getObjectByName('net_circuit_function_generator_2ch')!
      assert.ok(root); assert.deepEqual(root.position.toArray(), [0, 0, 0]); assert.deepEqual(root.scale.toArray(), [1, 1, 1])
      for (const name of generatorNodes) assert.ok(root.getObjectByName(name), name)
      assert.equal(((root.getObjectByName('enclosure') as Mesh).material as MeshStandardMaterial).color.getHexString(), 'a1aab4')
      const ports = ['ch1_output', 'ch2_output', 'sync_counter'].map((name) => root.getObjectByName(name)!)
      ports.forEach((port) => assert.equal(port.position.y, ports[0].position.y))
      const screen = root.getObjectByName('screen') as Mesh<any, MeshBasicMaterial>
      assert.ok(screen.material instanceof MeshBasicMaterial); assert.ok(screen.material.map)
      const positions = screen.geometry.getAttribute('position'), uv = screen.geometry.getAttribute('uv')
      for (let i = 0; i < positions.count; i++) assert.equal(uv.getY(i), positions.getY(i) > 0 ? 0 : 1, 'exported image top maps to the top of the screen')
      for (const name of ['encoder_knob']) {
        const pivot = root.getObjectByName(name)!, body = root.getObjectByName(`${name}_body`)!
        assert.equal(body.parent, pivot); assert.deepEqual(body.position.toArray(), [0, 0, 0])
      }
    } finally { disposeObject(loaded.scene) }
  } } finally { if (!progress) Reflect.deleteProperty(globalThis, 'ProgressEvent') }
})

test('generator decals contain requested model, five values per channel and distinct waveform previews', () => {
  const screen = generatorScreenArtwork(), legends = generatorLegendsArtwork()
  const words = screen.commands.filter(c => c.kind === 'text').map(c => c.text)
  for (const label of ['Frequency', 'Amplitude', 'Offset', 'Duty', 'Phase']) assert.equal(words.filter(w => w === label).length, 2)
  for (const label of ['CH1', 'CH2', 'Sine', 'Square']) assert.ok(words.includes(label))
  const svg = instrumentArtworkSvg(legends)
  for (const label of ['L1571979', 'DDS Function / Arbitrary Waveform Generator', '2 Channel']) assert.ok(svg.includes(label))
  assert.ok(!svg.includes('TNH2026'))
  assert.equal(screen.commands.filter(c => c.kind === 'path' && c.width === 5).length, 2)
})
