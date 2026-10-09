<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { WebGLRenderer } from 'three'
import { createSceneManager } from '../../three/SceneManager'
import { useWorkspaceStore } from '../../stores/workspace'
import { useCircuitStore } from '../../stores/circuit'
import { useUiStore } from '../../stores/ui'
import WorkbenchIcon from './WorkbenchIcon.vue'
const workspace = useWorkspaceStore()
const circuit = useCircuitStore()
const ui = useUiStore()
const host = ref<HTMLElement>()
const canvas = ref<HTMLCanvasElement>()
const graphicsError = ref('')
let manager: ReturnType<typeof createSceneManager> | undefined
let observer: ResizeObserver | undefined
function size() { if (host.value) { const { width, height } = host.value.getBoundingClientRect(); manager?.resize(width, height); ui.setViewport(width, height) } }
function lost(event: Event) { event.preventDefault(); graphicsError.value = 'Graphics context interrupted. Waiting for recovery…' }
function restored() { graphicsError.value = ''; size() }
onMounted(() => {
  try {
    const renderer = new WebGLRenderer({ canvas: canvas.value, antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    manager = createSceneManager({ renderer })
    manager.setZoom(workspace.zoom)
  } catch { graphicsError.value = '3D graphics unavailable. File tools and instrument windows remain available.' }
  observer = new ResizeObserver(size)
  if (host.value) observer.observe(host.value)
  canvas.value?.addEventListener('webglcontextlost', lost)
  canvas.value?.addEventListener('webglcontextrestored', restored)
  size()
})
watch(() => workspace.zoom, (zoom) => manager?.setZoom(zoom))
onUnmounted(() => { observer?.disconnect(); manager?.dispose(); canvas.value?.removeEventListener('webglcontextlost', lost); canvas.value?.removeEventListener('webglcontextrestored', restored) })
</script>
<template>
  <div ref="host" class="circuit-workspace">
    <canvas ref="canvas" aria-label="Three-dimensional circuit workspace" />
    <div class="workspace-caption"><span class="workspace-dot" /><strong>WORKSPACE</strong><span>{{ circuit.current?.name || 'No circuit open' }}</span></div>
    <div class="viewport-controls" role="toolbar" aria-label="Viewport controls"><span>Perspective</span><button aria-label="Zoom out" @click="workspace.setZoom(workspace.zoom - 10)"><WorkbenchIcon name="minus" /></button><output aria-label="Zoom">{{ workspace.zoom }}%</output><button aria-label="Zoom in" @click="workspace.setZoom(workspace.zoom + 10)"><WorkbenchIcon name="plus" /></button><button aria-label="Reset view" @click="workspace.setZoom(100)"><WorkbenchIcon name="reset" /></button></div>
    <div v-if="!circuit.graph?.modules.length" class="workspace-empty"><span class="empty-cross">+</span><p>Your next circuit starts here.</p><span>Explore the ribbon. Open an instrument.<br />Component placement arrives with the circuit editor.</span><div class="workspace-quick"><button @click="ui.openWindow('oscilloscope')">Oscilloscope</button><button @click="ui.openWindow('generator')">Generator</button><button @click="ui.openWindow('monitor')">Signal Monitor</button></div></div>
    <p v-else class="graph-loaded">{{ circuit.graph.modules.length }} graph modules loaded · 3D component rendering is pending.</p>
    <p v-if="graphicsError" class="graphics-notice" role="status">{{ graphicsError }}</p>
    <div class="workspace-hint"><span>{{ workspace.tool.toUpperCase() }}</span><span>{{ workspace.previewType ? 'Preview: ' + workspace.previewType : 'Visual grid · logical graph kept separate' }}</span></div>
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
