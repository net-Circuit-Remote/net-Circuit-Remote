<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { WebGLRenderer } from 'three'
import { createSceneManager, type OrientationAxis } from '../../three/SceneManager'
import { useWorkspaceStore } from '../../stores/workspace'
import { useCircuitStore } from '../../stores/circuit'
import { useUiStore } from '../../stores/ui'
import WorkspaceNavigator from './WorkspaceNavigator.vue'
import { useCircuitEditor } from '../../composables/useCircuitEditor'
const workspace = useWorkspaceStore()
const circuit = useCircuitStore()
const ui = useUiStore()
const host = ref<HTMLElement>()
const canvas = ref<HTMLCanvasElement>()
const graphicsError = ref('')
const axes = ref<OrientationAxis[]>([])
let manager: ReturnType<typeof createSceneManager> | undefined
let observer: ResizeObserver | undefined
let contextLost = false
const editor = useCircuitEditor(canvas, () => manager)
function visibility() { if (contextLost || document.hidden) editor.cancel(); manager?.suspend(contextLost || document.hidden) }
function updateGizmoObstacles() {
  const origin = host.value?.getBoundingClientRect(), stage = host.value?.parentElement
  if (manager && origin && stage) manager.setGizmoObstacles([...stage.querySelectorAll('.component-information, .floating-window, .workspace-navigator')].map((element) => {
      const r = element.getBoundingClientRect(); return { left: r.left - origin.left, top: r.top - origin.top, right: r.right - origin.left, bottom: r.bottom - origin.top }
  }))
}
function rendered() { editor.updatePorts(); if (manager) axes.value = manager.orientationAxes(); updateGizmoObstacles() }
function size() { if (host.value) { const { width, height } = host.value.getBoundingClientRect(); manager?.resize(width, height); ui.setViewport(width, height) } }
function lost(event: Event) { event.preventDefault(); contextLost = true; editor.cancel(); visibility(); graphicsError.value = 'Graphics context interrupted. Waiting for recovery…' }
function restored() { contextLost = false; graphicsError.value = ''; visibility(); editor.sync(); size() }
onMounted(() => {
  let renderer: WebGLRenderer | undefined
  try {
    renderer = new WebGLRenderer({ canvas: canvas.value, antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    manager = createSceneManager({ renderer, canvas: canvas.value, onRender: rendered })
    manager.setZoom(workspace.zoom)
    editor.sync(); visibility()
  } catch { renderer?.dispose(); graphicsError.value = '3D graphics unavailable. Edit graph coordinates and ports using Inspector.' }
  observer = new ResizeObserver(size)
  if (host.value) observer.observe(host.value)
  canvas.value?.addEventListener('webglcontextlost', lost)
  canvas.value?.addEventListener('webglcontextrestored', restored)
  document.addEventListener('visibilitychange', visibility)
  size()
})
watch(() => workspace.zoom, (zoom) => { editor.cancel(); manager?.setZoom(zoom) })
watch(() => workspace.fitRequest, () => { editor.cancel(); manager?.fitCircuit() })
watch(() => ui.windows, () => { void nextTick(updateGizmoObstacles) }, { deep: true })
onUnmounted(() => { observer?.disconnect(); manager?.dispose(); canvas.value?.removeEventListener('webglcontextlost', lost); canvas.value?.removeEventListener('webglcontextrestored', restored); document.removeEventListener('visibilitychange', visibility) })
</script>
<template>
  <div ref="host" :class="['circuit-workspace', { 'is-dragging': editor.dragging.value, 'can-grab': editor.hoveredHandle.value || (workspace.tool === 'move' && !workspace.placementType) }]" @dragover.prevent @drop="editor.drop">
    <canvas ref="canvas" tabindex="0" aria-label="Three-dimensional circuit workspace" aria-describedby="editor-help" @pointerdown="editor.pointerDown" @pointermove="editor.pointerMove" @pointerup="editor.pointerUp" @pointercancel="editor.cancel" @lostpointercapture="editor.cancel" @keydown="editor.keydown" @contextmenu.prevent @pointerleave="editor.pointerLeave" />
    <span id="editor-help" class="visually-hidden">Click to select or place. Left click places a model; right click or Escape cancels placement. Move allows dragging a model body. The selected object's adjacent gizmo offers X, Z, free X/Z movement and Y rotation; drag a highlighted handle, release to finish or Escape to cancel. Left drag empty surface pans. Right drag orbits, middle drag pans, wheel dollies. XYZ axes follow the camera. R rotates, Delete removes, arrows move a selection. Wire connects named logical ports. View tools and Workspace Object Snap are at the status bar's right.</span>
    <div v-if="!circuit.graph?.modules.length && !workspace.placementType" class="workspace-empty"><span class="empty-cross">+</span><p>Your next circuit starts here.</p><span>Drag a component from the ribbon.<br />Connect named ports to build your logical graph.</span></div>
    <div class="scene-ports"><button v-for="port in editor.ports.value" :key="port.endpoint" :class="['port-anchor', port.direction, { pending: workspace.pendingPort === port.endpoint }]" :style="{ left: port.x + 'px', top: port.y + 'px' }" :aria-label="'Connect port ' + port.endpoint" @click.stop="editor.connect(port.endpoint)">{{ port.endpoint.split('.')[1] }}</button></div>
    <details class="scene-inventory"><summary>Components ({{ circuit.graph?.modules.length || 0 }})</summary><div><button v-for="module in circuit.graph?.modules" :key="module.id" :aria-pressed="workspace.selectedModuleId === module.id" @click="editor.selectModule(module.id)">{{ module.id }}</button><button @click="ui.openWindow('inspector')">Open Inspector</button></div></details>
    <p v-if="workspace.editError" class="editor-error" role="alert">{{ workspace.editError }}<button @click="workspace.editError = ''">Dismiss</button></p>
    <p v-if="graphicsError" class="graphics-notice" role="status">{{ graphicsError }}</p>
    <p v-if="workspace.placementType" class="placement-notice">Choose a position · Right click or Esc to cancel</p>
    <WorkspaceNavigator :axes="axes" @orbit="editor.cancel(); manager?.orbit($event)" @pan="(horizontal, forward) => { editor.cancel(); manager?.pan(horizontal, forward) }" />
  </div>
</template>
