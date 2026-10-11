<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useWorkspaceStore, type WorkspaceTool } from '../../stores/workspace'
import { useUiStore } from '../../stores/ui'
import WorkbenchIcon from './WorkbenchIcon.vue'
const workspace = useWorkspaceStore()
const ui = useUiStore()
const toolList = ref<HTMLElement>()
const collapseToggle = ref<HTMLButtonElement>()
const collapseLabel = computed(() => ui.toolsSidebarCollapsed ? 'Expand tools sidebar' : 'Collapse tools sidebar')
watch(() => ui.toolsSidebarCollapsed, (collapsed) => {
  if (collapsed && toolList.value?.contains(document.activeElement)) void nextTick(() => collapseToggle.value?.focus())
})
const tools: { id: WorkspaceTool; name: string }[] = ['select', 'wire', 'move', 'rotate', 'delete', 'scope', 'probe'].map((id) => ({ id: id as WorkspaceTool, name: id[0].toUpperCase() + id.slice(1) }))
function select(tool: WorkspaceTool) {
  workspace.setTool(tool)
  if (tool === 'scope') ui.openWindow('oscilloscope')
  if (tool === 'probe') ui.openWindow('monitor')
}
</script>
<template>
  <aside class="tool-rail" :class="{ 'is-collapsed': ui.toolsSidebarCollapsed }" aria-label="Workspace tools">
    <button ref="collapseToggle" class="toolbar-collapse-toggle rail-collapse-toggle" :aria-label="collapseLabel" :title="collapseLabel" :aria-expanded="!ui.toolsSidebarCollapsed" aria-controls="editing-tools" @click="ui.toggleToolsSidebar()"><WorkbenchIcon name="chevron" /></button>
    <div v-show="!ui.toolsSidebarCollapsed" class="rail-label">TOOLS</div>
    <div v-show="!ui.toolsSidebarCollapsed" id="editing-tools" ref="toolList" role="toolbar" aria-label="Editing tools" aria-orientation="vertical">
      <button v-for="tool in tools" :key="tool.id" :aria-label="tool.name" :aria-pressed="workspace.tool === tool.id" :title="tool.name + (['scope', 'probe'].includes(tool.id) ? ' · open instrument' : ' · edit logical graph')" @click="select(tool.id)"><WorkbenchIcon :name="tool.id" /><span>{{ tool.name }}</span></button>
    </div>
    <span v-show="!ui.toolsSidebarCollapsed" class="rail-bottom">XZ</span>
  </aside>
</template>
