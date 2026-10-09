<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { WebGLRenderer } from 'three'
import { createSceneManager } from '../../three/SceneManager'
import { useWorkspaceStore } from '../../stores/workspace'
import { useCircuitStore } from '../../stores/circuit'
import { useUiStore } from '../../stores/ui'
import WorkbenchIcon from './WorkbenchIcon.vue'
import { useCircuitEditor } from '../../composables/useCircuitEditor'
const workspace = useWorkspaceStore()
const circuit = useCircuitStore()
const ui = useUiStore()
const host = ref<HTMLElement>()
const canvas = ref<HTMLCanvasElement>()
const graphicsError = ref('')
let manager: ReturnType<typeof createSceneManager> | undefined
let observer: ResizeObserver | undefined
let contextLost = false
const editor = useCircuitEditor(canvas, () => manager)
function visibility() { manager?.suspend(contextLost || document.hidden) }
function size() { if (host.value) { const { width, height } = host.value.getBoundingClientRect(); manager?.resize(width, height); ui.setViewport(width, height) } }
function lost(event: Event) { event.preventDefault(); contextLost = true; editor.cancel(); visibility(); graphicsError.value = 'Graphics context interrupted. Waiting for recovery…' }
function restored() { contextLost = false; graphicsError.value = ''; visibility(); editor.sync(); size() }
onMounted(() => {
  let renderer: WebGLRenderer | undefined
  try {
    renderer = new WebGLRenderer({ canvas: canvas.value, antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    manager = createSceneManager({ renderer, canvas: canvas.value, onRender: editor.updatePorts })
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
  <div ref="host" class="circuit-workspace" @dragover.prevent @drop="editor.drop">
    <canvas ref="canvas" tabindex="0" aria-label="Three-dimensional circuit workspace" aria-describedby="editor-help" @pointerdown="editor.pointerDown" @pointermove="editor.pointerMove" @pointerup="editor.pointerUp" @pointercancel="editor.cancel" @lostpointercapture="editor.cancel" @keydown="editor.keydown" @contextmenu.prevent @pointerleave="!workspace.placementType || editor.cancel()" />
    <span id="editor-help" class="visually-hidden">Click to select or place. Move tool drags a component. R rotates, Delete removes, arrows move, Escape cancels. Right drag orbits, middle drag pans. Wire connects named logical ports; keyboard controls are in Inspector.</span>
    <div class="workspace-caption"><span class="workspace-dot" /><strong>WORKSPACE</strong><span>{{ circuit.current?.name || 'No circuit open' }}</span></div>
    <div class="viewport-controls" role="toolbar" aria-label="Viewport controls"><span>Perspective</span><label class="snap-toggle"><input v-model="workspace.snap" type="checkbox" />Snap</label><button aria-label="Zoom out" @click="workspace.setZoom(workspace.zoom - 10)"><WorkbenchIcon name="minus" /></button><output aria-label="Zoom">{{ workspace.zoom }}%</output><button aria-label="Zoom in" @click="workspace.setZoom(workspace.zoom + 10)"><WorkbenchIcon name="plus" /></button><button aria-label="Reset view" @click="workspace.setZoom(100); manager?.resetView()"><WorkbenchIcon name="reset" /></button></div>
    <details class="view-options"><summary>View controls</summary><div><button @click="manager?.orbit(-15)">Orbit left</button><button @click="manager?.orbit(15)">Orbit right</button><button @click="manager?.pan(-0.5, 0)">Pan left</button><button @click="manager?.pan(0.5, 0)">Pan right</button><button @click="manager?.pan(0, -0.5)">Pan forward</button><button @click="manager?.pan(0, 0.5)">Pan back</button></div></details>
    <div v-if="!circuit.graph?.modules.length && !workspace.placementType" class="workspace-empty"><span class="empty-cross">+</span><p>Your next circuit starts here.</p><span>Drag a component from the ribbon.<br />Connect named ports to build your logical graph.</span></div>
    <div class="scene-ports"><button v-for="port in editor.ports.value" :key="port.endpoint" :class="['port-anchor', port.direction, { pending: workspace.pendingPort === port.endpoint }]" :style="{ left: port.x + 'px', top: port.y + 'px' }" :aria-label="'Connect port ' + port.endpoint" @click.stop="editor.connect(port.endpoint)">{{ port.endpoint.split('.')[1] }}</button></div>
    <details class="scene-inventory"><summary>Components ({{ circuit.graph?.modules.length || 0 }})</summary><div><button v-for="module in circuit.graph?.modules" :key="module.id" :aria-pressed="workspace.selectedModuleId === module.id" @click="editor.selectModule(module.id)">{{ module.id }}</button><button @click="ui.openWindow('inspector')">Open Inspector</button></div></details>
    <div v-if="editor.selected.value" class="selection-actions"><strong>{{ editor.selected.value.id }}</strong><button @click="ui.openWindow('inspector')">Properties</button><button @click="ui.openWindow('component-info')">Info</button><button aria-label="Rotate selected component" @click="circuit.rotateModule(editor.selected.value!.id)"><WorkbenchIcon name="rotate" /></button><button aria-label="Delete selected component" @click="circuit.removeModule(editor.selected.value!.id)"><WorkbenchIcon name="delete" /></button></div>
    <p v-if="workspace.editError" class="editor-error" role="alert">{{ workspace.editError }}<button @click="workspace.editError = ''">Dismiss</button></p>
    <p v-if="graphicsError" class="graphics-notice" role="status">{{ graphicsError }}</p>
    <div class="workspace-hint"><span>{{ workspace.placementType ? 'PLACE ' + workspace.placementType : workspace.tool.toUpperCase() }}</span><span>{{ workspace.placementType ? 'Click surface to place · Esc to cancel' : workspace.pendingPort ? workspace.pendingPort + ' → choose another port · Esc cancels' : 'Right drag: orbit · Middle drag: pan · Wheel: dolly · Ports are logical' }}</span></div>
    <div class="workspace-axis" aria-hidden="true">
      <svg viewBox="0 0 84 84" class="axis-gizmo" aria-hidden="true">
        <!-- Y Axis (Green) -->
        <line x1="42" y1="41" x2="42" y2="15" stroke="#00e676" stroke-width="3.5" stroke-linecap="round" />
        <polygon points="42,5 37,16 47,16" fill="#00e676" />
        <!-- X Axis (Red) -->
        <line x1="42" y1="45" x2="67" y2="59.5" stroke="#ff3d00" stroke-width="3.5" stroke-linecap="round" />
        <polygon points="76,64.5 65.5,63.5 70,55.5" fill="#ff3d00" />
        <!-- Z Axis (Blue) -->
        <line x1="42" y1="45" x2="17" y2="59.5" stroke="#2979ff" stroke-width="3.5" stroke-linecap="round" />
        <polygon points="8,64.5 14,55.5 18.5,63.5" fill="#2979ff" />
        <!-- Central Cube -->
        <g class="axis-cube">
          <polygon points="42,40 47,43 42,46 37,43" fill="#e2e8f0" />
          <polygon points="37,43 42,46 42,51.5 37,48.5" fill="#64748b" />
          <polygon points="42,46 47,43 47,48.5 42,51.5" fill="#94a3b8" />
        </g>
      </svg>
      <i class="axis-x">X</i>
      <i class="axis-y">Y</i>
      <i class="axis-z">Z</i>
    </div>
  </div>
</template>
