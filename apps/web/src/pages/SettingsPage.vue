<script setup lang="ts">
import { useUiStore } from '../stores/ui'
import { useStationStore } from '../stores/station'
const ui = useUiStore()
const station = useStationStore()
</script>
<template>
  <div class="content-page"><header class="page-heading"><div><p class="eyebrow">APPLICATION PREFERENCES</p><h1>Settings</h1><p class="muted">Adjust your laboratory layout for this session.</p></div></header><section class="panel settings-panel"><h2>Laboratory panels</h2><label class="setting-row"><span><strong>Component Library</strong><small>Browse logical components beside the workspace.</small></span><input type="checkbox" v-model="ui.libraryVisible" /></label><label class="setting-row"><span><strong>Properties / Inspector</strong><small>Inspect selections and the current Circuit Graph.</small></span><input type="checkbox" v-model="ui.inspectorVisible" /></label><label class="setting-row"><span><strong>Instrument dock</strong><small>Show instruments, Logic Analyzer, and Console.</small></span><input type="checkbox" v-model="ui.dockVisible" /></label></section><section class="panel settings-panel"><h2>Execution target</h2><p class="muted">Current mode: {{ station.mode }}. Choose a discovered station from the Stations page.</p><button class="button" @click="station.useSimulation()">Use simulation mode</button></section></div>
</template>
