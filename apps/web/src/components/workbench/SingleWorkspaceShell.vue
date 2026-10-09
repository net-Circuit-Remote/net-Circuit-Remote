<script setup lang="ts">
import { watch } from 'vue'
import { useLabConnection } from '../../composables/useLabConnection'
import { useCircuitStore } from '../../stores/circuit'
import { useWorkspaceStore } from '../../stores/workspace'
import AppTitleBar from './AppTitleBar.vue'
import ComponentRibbon from './ComponentRibbon.vue'
import ToolRail from './ToolRail.vue'
import CircuitWorkspace3D from './CircuitWorkspace3D.vue'
import SimulationStatusBar from './SimulationStatusBar.vue'
import FloatingWindowManager from '../windows/FloatingWindowManager.vue'
const circuit = useCircuitStore(), workspace = useWorkspaceStore()
if (!circuit.current && !circuit.drafts.length) { circuit.createDraft('Untitled circuit'); circuit.past = [] }
watch(() => circuit.activeId, () => workspace.clearSelection())
useLabConnection()
</script>
<template><div class="single-workspace-shell"><a class="skip-link" href="#workspace">Skip to workspace</a><AppTitleBar /><ComponentRibbon /><div class="workbench-body"><ToolRail /><main id="workspace" class="workspace-stage" tabindex="-1" aria-label="Circuit workbench"><CircuitWorkspace3D /><FloatingWindowManager /></main></div><SimulationStatusBar /></div></template>
