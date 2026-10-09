<script setup lang="ts">
import { useWorkspaceStore, type WorkspaceTool } from '../../stores/workspace'
import { useUiStore } from '../../stores/ui'
import WorkbenchIcon from './WorkbenchIcon.vue'
const workspace = useWorkspaceStore()
const ui = useUiStore()
const tools: { id: WorkspaceTool; name: string }[] = ['select', 'wire', 'move', 'rotate', 'delete', 'scope', 'probe'].map((id) => ({ id: id as WorkspaceTool, name: id[0].toUpperCase() + id.slice(1) }))
function select(tool: WorkspaceTool) {
  workspace.setTool(tool)
  if (tool === 'scope') ui.openWindow('oscilloscope')
  if (tool === 'probe') ui.openWindow('monitor')
}
</script>
<template><aside class="tool-rail" aria-label="Workspace tools"><div class="rail-label">TOOLS</div><div role="toolbar" aria-label="Editing tools" aria-orientation="vertical"><button v-for="tool in tools" :key="tool.id" :aria-label="tool.name" :aria-pressed="workspace.tool === tool.id" :title="tool.name + (['scope', 'probe'].includes(tool.id) ? ' · open instrument' : ' · edit logical graph')" @click="select(tool.id)"><WorkbenchIcon :name="tool.id" /><span>{{ tool.name }}</span></button></div><span class="rail-bottom">XZ</span></aside></template>
