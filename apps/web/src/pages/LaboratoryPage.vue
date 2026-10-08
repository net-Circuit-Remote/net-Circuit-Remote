<script setup lang="ts">
import { watch } from 'vue'
import ComponentLibrary from '../components/ComponentLibrary.vue'
import LabWorkspace from '../components/LabWorkspace.vue'
import PropertiesInspector from '../components/PropertiesInspector.vue'
import InstrumentDock from '../components/InstrumentDock.vue'
import ValidationNotice from '../components/ValidationNotice.vue'
import { useCircuitStore } from '../stores/circuit'
import { useWorkspaceStore } from '../stores/workspace'
import { useUiStore } from '../stores/ui'
const circuit = useCircuitStore()
const workspace = useWorkspaceStore()
const ui = useUiStore()
watch(() => circuit.activeId, () => workspace.clearSelection())
</script>
<template>
  <div class="laboratory-page">
    <header class="page-heading lab-heading"><div><p class="eyebrow">LABORATORY / WORKSPACE</p><h1>{{ circuit.current?.name ?? 'Laboratory' }}</h1><p class="muted">Your digital electronics workbench.</p></div><div class="heading-actions"><button class="button subtle" :aria-pressed="ui.libraryVisible" @click="ui.libraryVisible = !ui.libraryVisible">Library</button><button class="button subtle" :aria-pressed="ui.inspectorVisible" @click="ui.inspectorVisible = !ui.inspectorVisible">Inspector</button><button class="button subtle" :aria-pressed="ui.dockVisible" @click="ui.dockVisible = !ui.dockVisible">Dock</button><button class="button" :disabled="!circuit.graph || circuit.validating" @click="circuit.validateCurrent()">{{ circuit.validating ? 'Validating…' : 'Validate graph' }}</button></div></header>
    <ValidationNotice />
    <div class="lab-grid" :class="{ 'hide-library': !ui.libraryVisible, 'hide-inspector': !ui.inspectorVisible }"><ComponentLibrary v-if="ui.libraryVisible" /><LabWorkspace /><PropertiesInspector v-if="ui.inspectorVisible" /></div>
    <InstrumentDock v-if="ui.dockVisible" />
  </div>
</template>
