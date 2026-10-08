<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useExperimentStore } from '../stores/experiment'
const experiment = useExperimentStore()
</script>
<template>
  <div class="content-page"><header class="page-heading"><div><p class="eyebrow">EXPERIMENT LIFECYCLE</p><h1>Experiments</h1><p class="muted">A home for validated circuits and their results.</p></div><span class="phase-note">{{ experiment.state }}</span></header><section class="panel page-empty"><span class="empty-icon" aria-hidden="true">⌁</span><h2>No experiments yet</h2><p>Experiment execution and history arrive with the application backend and virtual end-to-end integration.</p><RouterLink class="button primary" to="/circuits">Prepare a circuit →</RouterLink></section></div>
</template>
