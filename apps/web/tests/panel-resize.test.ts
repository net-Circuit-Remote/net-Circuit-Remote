import { test } from 'node:test'
import assert from 'node:assert/strict'
import { effectScope, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useUiStore } from '../src/stores/ui'
import { usePanelResize } from '../src/composables/usePanelResize'

function setup(axis: 'x' | 'y' = 'x') {
  setActivePinia(createPinia())
  const ui = useUiStore(), enabled = ref(true), scope = effectScope(), captures = new Set<number>()
  ui.setToolsSidebarWidth(80); ui.setComponentToolbarHeight(120)
  const handle = { getAttribute: () => 'separator', focus() {}, setPointerCapture: (id: number) => captures.add(id), hasPointerCapture: (id: number) => captures.has(id), releasePointerCapture: (id: number) => captures.delete(id) }
  const resize = scope.run(() => usePanelResize({ axis, enabled: () => enabled.value, size: () => axis === 'x' ? ui.toolsSidebarWidth! : ui.componentToolbarHeight!, limits: () => axis === 'x' ? { min: 54, max: ui.toolsSidebarMaxWidth } : { min: 96, max: ui.componentToolbarMaxHeight }, setSize: axis === 'x' ? ui.setToolsSidebarWidth : ui.setComponentToolbarHeight }))!
  const pointer = (position: number, pointerId = 1, overrides = {}) => ({ clientX: position, clientY: position, pointerId, button: 0, buttons: 1, isPrimary: true, currentTarget: handle, preventDefault() {}, stopPropagation() {}, ...overrides } as unknown as PointerEvent)
  const key = (value: string, shiftKey = false) => ({ key: value, shiftKey, preventDefault() {}, stopPropagation() {} } as KeyboardEvent)
  return { ui, enabled, scope, captures, resize, pointer, key }
}

test('captured panel drag clamps sizes, ignores foreign pointers and retains release position', () => {
  const h = setup()
  try {
    h.resize.pointerDown(h.pointer(100))
    h.resize.pointerMove(h.pointer(140))
    assert.equal(h.ui.toolsSidebarWidth, 120)
    h.resize.pointerMove(h.pointer(999, 2)); h.resize.pointerUp(h.pointer(999, 2))
    assert.equal(h.ui.toolsSidebarWidth, 120); assert.equal(h.resize.dragging.value, true)
    h.resize.pointerMove(h.pointer(-999)); assert.equal(h.ui.toolsSidebarWidth, 54)
    h.resize.pointerUp(h.pointer(999, 1, { buttons: 0 }))
    assert.equal(h.ui.toolsSidebarWidth, 180); assert.equal(h.captures.size, 0)
    h.resize.lostPointerCapture(h.pointer(999))
    assert.equal(h.ui.toolsSidebarWidth, 180, 'normal release must not roll back the resize')
  } finally { h.scope.stop() }
})

test('foreign cancellation does not end the owned panel gesture; Escape rolls it back', () => {
  const h = setup('y')
  try {
    h.resize.pointerDown(h.pointer(100)); h.resize.pointerMove(h.pointer(160))
    assert.equal(h.ui.componentToolbarHeight, 180)
    h.resize.cancel(h.pointer(160, 2))
    assert.equal(h.resize.dragging.value, true)
    assert.equal(h.ui.componentToolbarHeight, 180)
    h.resize.keydown(h.key('Escape'))
    assert.equal(h.ui.componentToolbarHeight, 120); assert.equal(h.captures.size, 0)
  } finally { h.scope.stop() }
})

test('collapse, invalid input, pointer loss and unmount cancel without leaking capture', () => {
  for (const reason of ['collapse', 'invalid', 'lost', 'buttons', 'unmount']) {
    const h = setup()
    try {
      h.resize.pointerDown(h.pointer(100)); h.resize.pointerMove(h.pointer(130))
      if (reason === 'collapse') h.enabled.value = false
      if (reason === 'invalid') h.resize.pointerMove(h.pointer(NaN))
      if (reason === 'lost') h.resize.lostPointerCapture(h.pointer(130))
      if (reason === 'buttons') h.resize.pointerMove(h.pointer(130, 1, { buttons: 0 }))
      if (reason === 'unmount') h.scope.stop()
      assert.equal(h.ui.toolsSidebarWidth, 80, reason)
      assert.equal(h.resize.dragging.value, false, reason)
      assert.equal(h.captures.size, 0, reason)
      h.resize.pointerUp(h.pointer(999))
      assert.equal(h.ui.toolsSidebarWidth, 80)
    } finally { h.scope.stop() }
  }
})

test('only primary separator input starts resizing; clicking a toggle cannot resize', () => {
  const h = setup()
  try {
    for (const overrides of [{ button: 2 }, { isPrimary: false }, { currentTarget: { getAttribute: () => 'button' } }]) {
      h.resize.pointerDown(h.pointer(100, 1, overrides)); h.resize.pointerMove(h.pointer(200))
      assert.equal(h.ui.toolsSidebarWidth, 80); assert.equal(h.captures.size, 0)
    }
    h.enabled.value = false; h.resize.pointerDown(h.pointer(100))
    assert.equal(h.resize.dragging.value, false)
  } finally { h.scope.stop() }
})

test('keyboard sizing follows separator orientation, responsive bounds and remembered preferences', () => {
  const h = setup()
  try {
    h.resize.keydown(h.key('ArrowDown')); assert.equal(h.ui.toolsSidebarWidth, 80)
    h.resize.keydown(h.key('ArrowRight')); assert.equal(h.ui.toolsSidebarWidth, 88)
    h.resize.keydown(h.key('ArrowLeft', true)); assert.equal(h.ui.toolsSidebarWidth, 68)
    h.resize.keydown(h.key('Home')); assert.equal(h.ui.toolsSidebarWidth, 54)
    h.resize.keydown(h.key('End')); assert.equal(h.ui.toolsSidebarWidth, 180)
    h.ui.setWorkbenchSize(320, 300)
    h.resize.pointerDown(h.pointer(120)); h.resize.pointerMove(h.pointer(112))
    assert.equal(h.ui.toolsSidebarWidth, 112, 'drag starts at rendered size, not the wider remembered size')
    h.resize.cancel(); assert.equal(h.ui.toolsSidebarWidth, 180)
    h.resize.keydown(h.key('End')); assert.equal(h.ui.toolsSidebarWidth, 120)
  } finally { h.scope.stop() }
})
