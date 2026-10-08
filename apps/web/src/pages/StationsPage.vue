<script setup lang="ts">
import { useStationStore } from '../stores/station'
const station = useStationStore()
</script>
<template>
  <div class="content-page"><header class="page-heading"><div><p class="eyebrow">LAB INFRASTRUCTURE</p><h1>Stations</h1><p class="muted">Discover stations and choose an execution target.</p></div><button class="button" :disabled="station.loading" @click="station.refresh()">{{ station.loading ? 'Refreshing…' : 'Refresh stations' }}</button></header>
    <div class="notice mode-notice"><div><strong>Current mode: {{ station.mode === 'simulation' ? 'Simulation' : 'Remote hardware' }}</strong><p>{{ station.stationId ?? 'Local circuit editing. No experiment is running.' }}</p></div><button class="button subtle" @click="station.useSimulation()">Use simulation mode</button></div>
    <div v-if="station.error" class="notice error" role="alert"><strong>Station discovery failed</strong><p>{{ station.error }}</p><p v-if="station.stations.length">Showing the last discovery results. Refresh to confirm availability.</p></div>
    <p v-if="station.loading" class="muted" role="status">Discovering stations…</p>
    <section v-if="station.stations.length" class="station-grid" aria-label="Discovered stations"><article v-for="item in station.stations" :key="item.station_id" class="panel station-card"><header><span class="card-icon" aria-hidden="true">▤</span><span class="status-badge" :class="item.status.toLowerCase()">{{ item.status }}</span></header><h2>{{ item.station_id }}</h2><p class="muted">{{ item.mode === 'simulation' ? 'Virtual Hardware Station' : 'Physical Hardware Station' }}</p><dl class="property-list"><dt>API state</dt><dd>{{ item.state }}</dd><dt>Event connection</dt><dd>{{ station.eventsConnected ? 'Connected' : 'Disconnected' }}</dd></dl><p class="muted">{{ item.mode === 'simulation' ? 'Virtual execution will be connected in the simulation phases.' : 'Availability is reported by the application backend.' }}</p><button class="button full-width" :class="{ primary: station.stationId === item.station_id }" :aria-pressed="station.stationId === item.station_id" @click="station.selectStation(item.station_id)">{{ station.stationId === item.station_id ? 'Selected station' : 'Select station' }}</button></article></section>
    <div v-else-if="!station.loading && !station.error" class="panel page-empty"><h2>No stations discovered</h2><p>Refresh when a station becomes available.</p></div>
  </div>
</template>
