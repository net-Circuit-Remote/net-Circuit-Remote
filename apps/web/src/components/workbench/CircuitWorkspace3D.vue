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
      <svg viewBox="0 0 54 54" class="axis-lines" aria-hidden="true">
        <line x1="22" y1="32" x2="22" y2="13" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" />
        <line x1="22" y1="32" x2="41" y2="23" stroke="#ff4d4f" stroke-width="2.5" stroke-linecap="round" />
        <line x1="22" y1="32" x2="10" y2="44" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />
        <circle cx="22" cy="32" r="2.5" fill="#7f9db8" />
      </svg>
      <i class="axis-x">X</i><i class="axis-y">Y</i><i class="axis-z">Z</i>
    </div>
  </div>
</template>
