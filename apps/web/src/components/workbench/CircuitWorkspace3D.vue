<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { WebGLRenderer } from 'three'
import { createSceneManager, type OrientationAxis } from '../../three/SceneManager'
import { useWorkspaceStore } from '../../stores/workspace'
import { useCircuitStore } from '../../stores/circuit'
import { useUiStore } from '../../stores/ui'
import WorkbenchIcon from './WorkbenchIcon.vue'
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
function rendered() { editor.updatePorts(); if (manager) axes.value = manager.orientationAxes() }
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
watch(() => workspace.zoom, (zoom) => manager?.setZoom(zoom))
onUnmounted(() => { observer?.disconnect(); manager?.dispose(); canvas.value?.removeEventListener('webglcontextlost', lost); canvas.value?.removeEventListener('webglcontextrestored', restored); document.removeEventListener('visibilitychange', visibility) })
</script>
<template>
  <div ref="host" :class="['circuit-workspace', { 'is-dragging': editor.dragging.value, 'can-grab': workspace.tool === 'move' && !workspace.placementType }]" @dragover.prevent @drop="editor.drop">
    <canvas ref="canvas" tabindex="0" aria-label="Three-dimensional circuit workspace" aria-describedby="editor-help" @pointerdown="editor.pointerDown" @pointermove="editor.pointerMove" @pointerup="editor.pointerUp" @pointercancel="editor.cancel" @lostpointercapture="editor.cancel" @keydown="editor.keydown" @contextmenu.prevent @pointerleave="!workspace.placementType || editor.cancel()" />
    <span id="editor-help" class="visually-hidden">Click to select or place. Left click places a model; right click or Escape cancels placement. Use Move to left drag a model; Select only selects. Left drag empty surface to pan. Right drag orbits, middle drag also pans, wheel dollies. XYZ axes follow the camera; nearby arrow buttons orbit and pan. R rotates, Delete removes, arrows move a selection. Wire connects named logical ports; keyboard controls are in Inspector.</span>
    <div class="workspace-caption"><span class="workspace-dot" /><strong>WORKSPACE</strong><span>{{ circuit.current?.name || 'No circuit open' }}</span></div>
    <div class="viewport-controls" role="toolbar" aria-label="Viewport controls"><span>Perspective</span><label class="snap-toggle"><input v-model="workspace.snap" type="checkbox" />Snap</label><button aria-label="Zoom out" @click="workspace.setZoom(workspace.zoom - 10)"><WorkbenchIcon name="minus" /></button><output aria-label="Zoom">{{ workspace.zoom }}%</output><button aria-label="Zoom in" @click="workspace.setZoom(workspace.zoom + 10)"><WorkbenchIcon name="plus" /></button><button aria-label="Reset view" @click="workspace.setZoom(100); manager?.resetView()"><WorkbenchIcon name="reset" /></button></div>
    <div v-if="!circuit.graph?.modules.length && !workspace.placementType" class="workspace-empty"><span class="empty-cross">+</span><p>Your next circuit starts here.</p><span>Drag a component from the ribbon.<br />Connect named ports to build your logical graph.</span></div>
    <div class="scene-ports"><button v-for="port in editor.ports.value" :key="port.endpoint" :class="['port-anchor', port.direction, { pending: workspace.pendingPort === port.endpoint }]" :style="{ left: port.x + 'px', top: port.y + 'px' }" :aria-label="'Connect port ' + port.endpoint" @click.stop="editor.connect(port.endpoint)">{{ port.endpoint.split('.')[1] }}</button></div>
    <details class="scene-inventory"><summary>Components ({{ circuit.graph?.modules.length || 0 }})</summary><div><button v-for="module in circuit.graph?.modules" :key="module.id" :aria-pressed="workspace.selectedModuleId === module.id" @click="editor.selectModule(module.id)">{{ module.id }}</button><button @click="ui.openWindow('inspector')">Open Inspector</button></div></details>
    <div v-if="editor.selected.value" class="selection-actions"><strong>{{ editor.selected.value.id }}</strong><button @click="ui.openWindow('inspector')">Properties</button><button @click="ui.openWindow('component-info')">Info</button><button aria-label="Rotate selected component" @click="circuit.rotateModule(editor.selected.value!.id)"><WorkbenchIcon name="rotate" /></button><button aria-label="Delete selected component" @click="circuit.removeModule(editor.selected.value!.id)"><WorkbenchIcon name="delete" /></button></div>
    <p v-if="workspace.editError" class="editor-error" role="alert">{{ workspace.editError }}<button @click="workspace.editError = ''">Dismiss</button></p>
    <p v-if="graphicsError" class="graphics-notice" role="status">{{ graphicsError }}</p>
    <div class="workspace-hint"><span>{{ workspace.placementType ? 'PLACE ' + workspace.placementType : workspace.tool.toUpperCase() }}</span><span>{{ workspace.placementType ? 'Left click surface to place · Right click or Esc to cancel' : workspace.pendingPort ? workspace.pendingPort + ' → choose another port · Esc cancels' : workspace.tool === 'move' ? 'Left drag: pan / move model · Right drag: orbit · Wheel: dolly' : 'Left drag empty surface: pan · Right drag: orbit · Wheel: dolly' }}</span></div>
    <WorkspaceNavigator :axes="axes" @orbit="manager?.orbit($event)" @pan="(horizontal, forward) => manager?.pan(horizontal, forward)" />
  </div>
</template>
