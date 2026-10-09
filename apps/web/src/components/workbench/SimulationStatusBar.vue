<script setup lang="ts">
import { useCircuitStore } from '../../stores/circuit'
import { useStationStore } from '../../stores/station'
import { useExperimentStore } from '../../stores/experiment'
import { useUiStore } from '../../stores/ui'
import HardwareStatus from '../HardwareStatus.vue'
import WorkbenchIcon from './WorkbenchIcon.vue'
const circuit = useCircuitStore(), station = useStationStore(), experiment = useExperimentStore(), ui = useUiStore()
</script>
<template><footer class="simulation-statusbar" aria-label="Simulation status"><div class="execution-buttons" role="toolbar" aria-label="Simulation controls"><button disabled title="Run unavailable: simulation execution API is not connected"><WorkbenchIcon name="play" />Run</button><button disabled title="Stop unavailable: no execution is active" aria-label="Stop"><WorkbenchIcon name="stop" /></button><button disabled title="Step unavailable: simulation execution API is not connected"><WorkbenchIcon name="step" />Step</button></div><span class="simulation-state">{{ experiment.state === 'idle' ? 'Stopped' : experiment.state }}<small>Engine pending</small></span><button class="mode-control" @click="ui.openWindow('inspector')" title="Change execution target in Inspector">Mode: {{ station.mode === 'simulation' ? 'Simulation' : 'Hardware' }}</button><span title="No execution timing data">Frequency <b>—</b></span><span title="No simulation time step data">Time step <b>—</b></span><span class="count-status">Components <b>{{ circuit.graph?.modules.length ?? 0 }}</b><span>Wires <b>{{ circuit.graph?.connections.length ?? 0 }}</b></span></span><div class="connection-status"><HardwareStatus /><button @click="ui.openWindow('inspector')" :class="{ connected: ui.connectionState === 'connected' }" :title="station.error || 'Backend event connection'"><i />{{ ui.connectionState }}</button></div></footer></template>
