<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ribbonGroups, iconUrl, type LibraryComponent } from '../../data/ribbon'
import { useUiStore } from '../../stores/ui'
import { useWorkspaceStore } from '../../stores/workspace'
import WorkbenchIcon from './WorkbenchIcon.vue'
import { getDefinition } from '../../data/editorCatalog'
const ui = useUiStore()
const workspace = useWorkspaceStore()
const root = ref<HTMLElement>()
const active = computed(() => ribbonGroups.find((group) => group.id === ui.activeRibbonGroup))
function choose(item: LibraryComponent) {
  // The palette will disappear. Retain a stable keyboard return target first.
  root.value?.querySelector<HTMLButtonElement>(`[data-group="${ui.activeRibbonGroup}"]`)?.focus()
  if (item.window) ui.openWindow(item.window)
  else if (item.type === 'JUMPER') workspace.setTool('wire')
  else if (getDefinition(item.type)) workspace.armPlacement(item.type)
  else { workspace.preview(item.type); ui.openWindow('component-info') }
  ui.activeRibbonGroup = null
}
function drag(event: DragEvent, item: LibraryComponent) {
  if (!getDefinition(item.type) || !event.dataTransfer) { event.preventDefault(); return }
  event.dataTransfer.setData('application/x-netcircuit-component', item.type)
  event.dataTransfer.effectAllowed = 'copy'
  workspace.armPlacement(item.type)
}
function info(item: LibraryComponent) {
  root.value?.querySelector<HTMLButtonElement>(`[data-group="${ui.activeRibbonGroup}"]`)?.focus()
  workspace.preview(item.type); ui.openWindow('component-info'); ui.activeRibbonGroup = null
}
function outside(event: PointerEvent) { if (event.target instanceof Node && !root.value?.contains(event.target)) ui.activeRibbonGroup = null }
function escape(event: KeyboardEvent) { if (event.key === 'Escape' && ui.activeRibbonGroup) { root.value?.querySelector<HTMLButtonElement>(`[data-group="${ui.activeRibbonGroup}"]`)?.focus(); ui.activeRibbonGroup = null } }
onMounted(() => { document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape) })
onUnmounted(() => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) })
</script>
<template>
  <section ref="root" class="component-ribbon" aria-label="Component library">
    <div class="ribbon-heading"><span>COMPONENT LIBRARY</span><small>Drag to workspace or click to place</small><span class="ribbon-phase">INTERACTIVE WORKSPACE <i /> PHASE 02</span></div>
    <div class="ribbon-scroll" role="toolbar" aria-label="Component families">
      <button v-for="group in ribbonGroups" :key="group.id" :data-group="group.id" :aria-expanded="ui.activeRibbonGroup === group.id" aria-controls="ribbon-palette" :class="{ active: ui.activeRibbonGroup === group.id }" @click="ui.toggleRibbon(group.id)">
        <span class="ribbon-art"><img v-if="group.icon" :src="iconUrl(group.icon)" alt="" width="44" height="44" /><WorkbenchIcon v-else :name="group.glyph || 'chip'" /></span>
        <span class="ribbon-label">{{ group.label }}</span><WorkbenchIcon class="ribbon-chevron" name="chevron" />
      </button>
    </div>
    <div v-if="active" id="ribbon-palette" class="ribbon-palette" :aria-label="active.label + ' components'">
      <div class="palette-heading"><strong>{{ active.label }}</strong><span>{{ active.items.length }} entries · functional models / visuals</span></div>
      <div class="palette-items"><div v-for="item in active.items" :key="item.type" class="palette-entry"><button :draggable="!!getDefinition(item.type)" @dragstart="drag($event, item)" @click="choose(item)"><span class="palette-art"><img v-if="item.icon" :src="iconUrl(item.icon)" alt="" width="58" height="58" /><WorkbenchIcon v-else :name="item.glyph || 'chip'" /></span><strong>{{ item.name }}</strong><small>{{ item.window ? 'Open window' : getDefinition(item.type) ? 'Place component' : item.type === 'JUMPER' ? 'Connect ports' : 'Metadata preview' }}</small></button><button class="palette-info" :aria-label="'Information about ' + item.name" @click="info(item)">Info</button></div></div>
    </div>
  </section>
</template>
