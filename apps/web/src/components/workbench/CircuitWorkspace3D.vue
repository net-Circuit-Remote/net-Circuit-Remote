<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { WebGLRenderer } from 'three'
import { createSceneManager, type OrientationAxis } from '../../three/SceneManager'
import { useWorkspaceStore } from '../../stores/workspace'
import { useCircuitStore } from '../../stores/circuit'
import { useUiStore } from '../../stores/ui'
import { getDefinition } from '../../data/editorCatalog'
import WorkbenchIcon from './WorkbenchIcon.vue'
import WorkspaceNavigator from './WorkspaceNavigator.vue'
import { useCircuitEditor } from '../../composables/useCircuitEditor'
const workspace = useWorkspaceStore()
const circuit = useCircuitStore()
const ui = useUiStore()
const selectedDef = computed(() => {
  const mod = editor.selected.value
  return mod ? getDefinition(mod.type) : undefined
})
function formatCoord(val: number | undefined): string {
  if (val === undefined || Number.isNaN(val)) return '0.00'
  return val.toFixed(2)
}
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
    <aside v-if="editor.selected.value" class="workspace-info-card" role="region" aria-label="Selected component details and tools">
      <div class="workspace-info-header">
        <div class="workspace-info-title-group">
          <span class="info-status-dot" aria-hidden="true" />
          <span class="workspace-info-name" :title="selectedDef?.name || editor.selected.value.id">{{ selectedDef?.name || editor.selected.value.id }}</span>
        </div>
        <button class="info-close-btn" aria-label="Deselect component" title="Deselect component" @click="workspace.clearSelection()"><WorkbenchIcon name="close" /></button>
      </div>
      <div class="workspace-info-meta">
        <span class="info-id-tag">{{ editor.selected.value.id }}</span>
        <span class="info-family-tag">{{ selectedDef?.family || 'Component' }}</span>
      </div>
      <div class="workspace-info-specs">
        <div class="info-spec-item"><span class="info-spec-label">Position</span><span class="info-spec-value">X: {{ formatCoord(editor.selected.value.position?.x) }} · Z: {{ formatCoord(editor.selected.value.position?.z) }}</span></div>
        <div class="info-spec-item"><span class="info-spec-label">Rotation</span><span class="info-spec-value">{{ editor.selected.value.rotation ?? 0 }}°</span></div>
        <div class="info-spec-item"><span class="info-spec-label">Dimensions</span><span class="info-spec-value">{{ selectedDef?.size ? `${selectedDef.size[0]} × ${selectedDef.size[2]} cm` : 'Standard' }}</span></div>
        <div class="info-spec-item"><span class="info-spec-label">Capacity</span><span class="info-spec-value">{{ editor.selected.value.type === 'breadboard' ? '830 Points' : editor.selected.value.type === 'breadboard_half' ? '630 Points' : editor.selected.value.type === 'breadboard_mini' ? '100 Points' : `${selectedDef?.ports?.length || 0} Ports` }}</span></div>
      </div>
      <div class="workspace-info-actions">
        <button class="action-rotate" aria-label="Rotate selected component 90 degrees" title="Rotate 90° (R)" @click="circuit.rotateModule(editor.selected.value!.id)"><WorkbenchIcon name="rotate" /><span>Rotate 90°</span><span class="action-shortcut">R</span></button>
        <button class="action-delete" aria-label="Delete selected component" title="Delete component (Del)" @click="circuit.removeModule(editor.selected.value!.id)"><WorkbenchIcon name="delete" /><span>Delete</span><span class="action-shortcut">Del</span></button>
      </div>
      <div class="workspace-info-secondary-links">
        <button aria-label="Open Inspector window" title="Edit properties, nets and timing" @click="ui.openWindow('inspector')">Properties</button>
        <button aria-label="Open Component Information window" title="View pinout, truth table and documentation" @click="ui.openWindow('component-info')">Info & Pinout</button>
      </div>
    </aside>
    <p v-if="workspace.editError" class="editor-error" role="alert">{{ workspace.editError }}<button @click="workspace.editError = ''">Dismiss</button></p>
    <p v-if="graphicsError" class="graphics-notice" role="status">{{ graphicsError }}</p>
    <div class="workspace-hint"><span>{{ workspace.placementType ? 'PLACE ' + workspace.placementType : workspace.tool.toUpperCase() }}</span><span>{{ workspace.placementType ? 'Left click surface to place · Right click or Esc to cancel' : workspace.pendingPort ? workspace.pendingPort + ' → choose another port · Esc cancels' : workspace.tool === 'move' ? 'Left drag: pan / move model · Right drag: orbit · Wheel: dolly' : 'Left drag empty surface: pan · Right drag: orbit · Wheel: dolly' }}</span></div>
    <WorkspaceNavigator :axes="axes" @orbit="manager?.orbit($event)" @pan="(horizontal, forward) => manager?.pan(horizontal, forward)" />
  </div>
</template>
