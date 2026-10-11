<script setup lang="ts">
import { useCircuitStore } from '../../stores/circuit'
import { useStationStore } from '../../stores/station'
import { useExperimentStore } from '../../stores/experiment'
import { useUiStore } from '../../stores/ui'
import { useWorkspaceStore } from '../../stores/workspace'
import HardwareStatus from '../HardwareStatus.vue'
import WorkbenchIcon from './WorkbenchIcon.vue'
import { nextTick } from 'vue'
const circuit = useCircuitStore(), station = useStationStore(), experiment = useExperimentStore(), ui = useUiStore()
const workspace = useWorkspaceStore()
function zoomToArea() {
  workspace.toggleZoomArea()
  if (workspace.zoomAreaActive) void nextTick(() => document.querySelector<HTMLCanvasElement>('canvas[aria-label="Three-dimensional circuit workspace"]')?.focus())
}
</script>
<template>
  <footer class="simulation-statusbar" aria-label="Simulation status">
    <div class="execution-buttons" role="toolbar" aria-label="Simulation controls"><button disabled title="Run unavailable: simulation execution API is not connected"><WorkbenchIcon name="play" />Run</button><button disabled title="Stop unavailable: no execution is active" aria-label="Stop"><WorkbenchIcon name="stop" /></button><button disabled title="Step unavailable: simulation execution API is not connected"><WorkbenchIcon name="step" />Step</button></div>
    <span class="simulation-state">{{ experiment.state === 'idle' ? 'Stopped' : experiment.state }}<small>Engine pending</small></span>
    <button class="mode-control" @click="ui.openWindow('inspector')" title="Change execution target in Inspector">Mode: {{ station.mode === 'simulation' ? 'Simulation' : 'Hardware' }}</button>
    <span title="No execution timing data">Frequency <b>—</b></span><span title="No simulation time step data">Time step <b>—</b></span>
    <span class="count-status">Components <b>{{ circuit.graph?.modules.length ?? 0 }}</b><span>Wires <b>{{ circuit.graph?.connections.length ?? 0 }}</b></span></span>
    <div class="connection-status"><HardwareStatus /><button @click="ui.openWindow('inspector')" :class="{ connected: ui.connectionState === 'connected' }" :title="station.error || 'Backend event connection'"><i />{{ ui.connectionState }}</button></div>
    <div class="status-viewport-tools" role="toolbar" aria-label="Workspace view controls">
      <label class="snap-toggle" title="Workspace Object Snap: align placement and movement to 0.5-unit spacing, dock modular breadboards and snap gizmo rotation to 15 degrees."><input v-model="workspace.snap" type="checkbox" aria-label="Workspace Object Snap" aria-describedby="workspace-snap-help" />Object Snap</label>
      <button aria-label="Zoom Out" title="Zoom Out" :disabled="workspace.zoom <= 50" @click="workspace.setZoom(workspace.zoom - 10)"><WorkbenchIcon name="minus" /></button>
      <output aria-label="Workspace magnification">{{ workspace.zoom }}%</output>
      <button aria-label="Zoom In" title="Zoom In" :disabled="workspace.zoom >= 200" @click="workspace.setZoom(workspace.zoom + 10)"><WorkbenchIcon name="plus" /></button>
      <button aria-label="Zoom To View Entire Circuit" title="Zoom To View Entire Circuit" :disabled="!circuit.graph?.modules.length" @click="workspace.fitEntireCircuit()"><WorkbenchIcon name="reset" /></button>
      <button aria-label="Zoom To Area" title="Zoom To Area" :aria-pressed="workspace.zoomAreaActive" @click="zoomToArea"><WorkbenchIcon name="zoom-area" /></button>
    </div>
    <span id="workspace-snap-help" class="visually-hidden">Workspace Object Snap aligns placement and movement to 0.5-unit spacing, docks modular breadboards during free movement and snaps gizmo rotation to 15 degrees. Turn off for fine positioning and continuous rotation.</span>
  </footer>
</template>
