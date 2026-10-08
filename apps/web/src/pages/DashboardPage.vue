<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useCircuitStore } from '../stores/circuit'
import { useStationStore } from '../stores/station'
import { useUiStore } from '../stores/ui'
const circuit = useCircuitStore()
const station = useStationStore()
const ui = useUiStore()
</script>
<template>
  <div class="content-page"><header class="page-heading"><div><p class="eyebrow">REMOTE DIGITAL ELECTRONICS</p><h1>Your laboratory, connected.</h1><p class="muted">A workspace for circuits, virtual experiments, and remote stations.</p></div><span class="phase-note">Phase 1 / Web Foundation</span></header>
    <section class="panel dashboard-hero"><div><span class="eyebrow">START EXPLORING</span><h2>From a circuit idea<br />to an experiment.</h2><p>Prepare a logical circuit in the laboratory.<br />Inspect the graph and discover available stations.</p><RouterLink class="button primary" to="/laboratory">Open Laboratory →</RouterLink></div><div class="hero-circuit" aria-hidden="true"><span>IN</span><i /><strong>&</strong><i /><span>OUT</span></div></section>
    <div class="summary-grid"><RouterLink to="/circuits" class="panel summary-card"><span class="eyebrow">CIRCUITS</span><strong>{{ circuit.drafts.length }}</strong><span>Session drafts <span class="chevron">↗</span></span></RouterLink><RouterLink to="/stations" class="panel summary-card"><span class="eyebrow">STATIONS</span><strong>{{ station.loaded ? station.stations.length : '—' }}</strong><span>{{ station.error ? 'Discovery unavailable' : 'Discovered targets' }} <span class="chevron">↗</span></span></RouterLink><div class="panel summary-card"><span class="eyebrow">EVENT CONNECTION</span><strong class="connection-summary">{{ ui.connectionState }}</strong><span>Automatic reconnect enabled</span></div></div>
    <section class="panel workflow-note"><span class="card-icon" aria-hidden="true">i</span><div><h2>Simulation first</h2><p class="muted">The foundation is ready for circuit editing, simulation, and instrument features in the next phases. Physical execution follows the Web integration milestone.</p></div></section>
  </div>
</template>
