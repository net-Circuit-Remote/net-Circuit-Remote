<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useStationStore } from '../stores/station'

const store = useStationStore()
const { mode, state, stationId } = storeToRefs(store)
</script>

<template>
  <section class="status-card" aria-label="Hardware status">
    <strong>{{ mode === 'simulation' ? 'Simulation' : 'Remote Hardware' }}</strong>
    <span>{{ stationId }}</span>
    <span class="state">{{ state }}</span>
  </section>
</template>
