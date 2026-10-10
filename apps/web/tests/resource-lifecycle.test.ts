import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BoxGeometry, Group, InstancedMesh, Mesh, MeshStandardMaterial, Sprite, Texture } from 'three'
import { buildComponent, disposeObject } from '../src/three/ComponentModel'

test('disposing a subtree releases shared geometry, materials and every texture slot once', () => {
  const root = new Group(), geometry = new BoxGeometry()
  const color = new Texture(), normal = new Texture(), roughness = new Texture()
  const material = new MeshStandardMaterial({ map: color, alphaMap: color, normalMap: normal, roughnessMap: roughness })
  const counts = new Map<object, number>()
  for (const resource of [geometry, material, color, normal, roughness]) {
    counts.set(resource, 0)
    resource.addEventListener('dispose', () => counts.set(resource, counts.get(resource)! + 1))
  }
  const instances = new InstancedMesh(geometry, material, 2)
  let instanceDisposals = 0
  instances.addEventListener('dispose', () => instanceDisposals++)
  root.add(new Mesh(geometry, [material, material]), new Mesh(geometry, material), instances)
  disposeObject(root)
  assert.deepEqual([...counts.values()], [1, 1, 1, 1, 1])
  assert.equal(instanceDisposals, 1, 'instance buffers have their own disposal event')
})

test('disposing one model label leaves the surviving model label geometry intact', () => {
  const dom = fakeArtworkDocument()
  const firstModel = buildComponent({ id: 'A', type: 'BUTTON' }), secondModel = buildComponent({ id: 'B', type: 'BUTTON' })
  const first = firstModel.children.find(child => child instanceof Sprite) as Sprite
  const second = secondModel.children.find(child => child instanceof Sprite) as Sprite
  let geometryDisposals = 0, materialDisposals = 0
  const onDispose = () => geometryDisposals++
  second.geometry.addEventListener('dispose', onDispose)
  first.material.addEventListener('dispose', () => materialDisposals++)
  try {
    disposeObject(firstModel)
    assert.equal(materialDisposals, 1)
    assert.equal(geometryDisposals, 0, 'removing one model must not invalidate other model labels')
  } finally {
    second.geometry.removeEventListener('dispose', onDispose)
    disposeObject(secondModel)
    dom.restore()
  }
})

// Keep TextureLoader and ImageLoader real; control only the browser's canvas and
// delayed image event, so these cases exercise Three's late image assignment.
function fakeArtworkDocument() {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document')
  const images: EventTarget[] = []
  const context = {
    clearRect() {}, fillRect() {}, strokeRect() {}, beginPath() {}, roundRect() {}, fill() {}, stroke() {},
    moveTo() {}, lineTo() {}, closePath() {}, fillText() {}, setLineDash() {}, arc() {},
    measureText() { return { width: 40 } },
  }
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    createElement(tag: string) { assert.equal(tag, 'canvas'); return { getContext: () => context } },
    createElementNS(_ns: string, tag: string) { assert.equal(tag, 'img'); const image = new EventTarget(); images.push(image); return image },
  } })
  return {
    images,
    restore() { if (previous) Object.defineProperty(globalThis, 'document', previous); else Reflect.deleteProperty(globalThis, 'document') },
  }
}

for (const [type, logoName] of [['POWER_SUPPLY', 'supply-brand-icon'], ['GENERATOR', 'brand_owl'], ['OSCILLOSCOPE', 'brand_owl']]) {
  test(`${type} late logo completion cannot invoke a deleted model's scene callback`, () => {
    const dom = fakeArtworkDocument(), model = buildComponent({ id: 'I', type })
    let callbacks = 0
    model.userData.onVisualChange = () => callbacks++
    try {
      assert.equal(dom.images.length, 1)
      disposeObject(model)
      dom.images[0].dispatchEvent(new Event('load'))
      assert.equal(callbacks, 0, 'late image load must not schedule a removed model')
      assert.equal(model.userData.onVisualChange, undefined, 'disposal releases the scene callback reference')
    } finally { dom.restore() }
  })

  test(`${type} discards a logo image delivered after texture disposal`, () => {
    const dom = fakeArtworkDocument(), model = buildComponent({ id: 'I', type })
    try {
      const logo = model.getObjectByName(logoName) as Mesh<any, MeshStandardMaterial>
      const texture = logo.material.map!
      assert.ok(texture instanceof Texture)
      disposeObject(model)
      dom.images[0].dispatchEvent(new Event('load'))
      assert.equal(texture.image, null, 'a dead texture must not retain the decoded image')
    } finally { dom.restore() }
  })

  test(`${type} live logo completion schedules once and disposal releases the loaded image`, () => {
    const dom = fakeArtworkDocument(), model = buildComponent({ id: 'I', type })
    let callbacks = 0
    model.userData.onVisualChange = () => callbacks++
    try {
      const logo = model.getObjectByName(logoName) as Mesh<any, MeshStandardMaterial>
      const texture = logo.material.map!
      dom.images[0].dispatchEvent(new Event('load'))
      assert.equal(callbacks, 1)
      assert.equal(texture.image, dom.images[0])
      disposeObject(model)
      assert.equal(texture.image, null)
      assert.equal(model.userData.onVisualChange, undefined)
    } finally { dom.restore() }
  })
}
