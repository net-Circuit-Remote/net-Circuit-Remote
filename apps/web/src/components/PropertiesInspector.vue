<script setup lang="ts">
import { computed } from 'vue'
import { useCircuitStore } from '../stores/circuit'
import { useWorkspaceStore } from '../stores/workspace'
import { useStationStore } from '../stores/station'
import { componentLibrary } from '../data/componentLibrary'
const circuit = useCircuitStore()
const workspace = useWorkspaceStore()
const station = useStationStore()
const preview = computed(() => componentLibrary.find((item) => item.type === workspace.previewType))
</script>
<template>
  <aside class="panel inspector" aria-label="Properties and Inspector">
    <header class="panel-header"><h2>Inspector</h2><span class="eyebrow">PROPERTIES</span></header>
    <div class="panel-body" v-if="preview">
      <span class="component-symbol inspector-symbol" aria-hidden="true">{{ preview.symbol }}</span>
      <h3>{{ preview.name }}</h3><p class="muted">{{ preview.description }}</p>
      <dl class="property-list"><dt>Type</dt><dd class="mono">{{ preview.type }}</dd><dt>Category</dt><dd>{{ preview.category }}</dd><dt>Selection</dt><dd>Library preview</dd></dl>
      <button class="button subtle full-width" @click="workspace.clearSelection()">Clear selection</button>
    </div>
    <div class="panel-body" v-else>
      <p class="eyebrow">CIRCUIT OVERVIEW</p><h3>{{ circuit.current?.name ?? 'No circuit selected' }}</h3>
      <dl class="property-list"><dt>Modules</dt><dd>{{ circuit.graph?.modules.length ?? 0 }}</dd><dt>Connections</dt><dd>{{ circuit.graph?.connections.length ?? 0 }}</dd><dt>Schema</dt><dd>1.0</dd><dt>Execution mode</dt><dd>{{ station.mode }}</dd></dl>
      <p class="muted">Select a library component to preview its properties.</p>
    </div>
    <div class="panel-note"><span class="eyebrow">VALIDATION</span><p v-if="circuit.validation">{{ circuit.validation.message }}</p><p v-else>Validate the current graph before moving to an experiment.</p></div>
  </aside>
</template>
