<script setup lang="ts">
import { useStationStore } from '../stores/station'
const store = useStationStore()
const labels = { SIMULATION: 'Simulation', HARDWARE_AVAILABLE: 'Hardware available', HARDWARE_BUSY: 'Hardware busy', HARDWARE_OFFLINE: 'Hardware offline', FAULT: 'Fault' }
</script>

<template>
  <span class="status-badge" :class="store.status.toLowerCase()" :title="store.status + (store.stationId ? ' · ' + store.stationId : '')" role="status" aria-label="Execution status"><i />{{ labels[store.status] }}</span>
</template>
