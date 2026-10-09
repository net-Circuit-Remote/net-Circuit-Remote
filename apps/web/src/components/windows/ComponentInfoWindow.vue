<script setup lang="ts">
import { computed } from 'vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { useCircuitStore } from '../../stores/circuit'
import { libraryComponents, iconUrl } from '../../data/ribbon'
import WorkbenchIcon from '../workbench/WorkbenchIcon.vue'
const workspace = useWorkspaceStore(), circuit = useCircuitStore()
const type = computed(() => circuit.graph?.modules.find((module) => module.id === workspace.selectedModuleId)?.type || workspace.previewType)
const item = computed(() => libraryComponents.find((item) => item.type === type.value))
const format = (value: unknown) => value === null ? 'Not configured' : typeof value === 'object' ? JSON.stringify(value) : String(value)
</script>
<template><template v-if="item"><div class="component-preview"><img v-if="item.icon" :src="iconUrl(item.icon)" :alt="item.name + ' supplied artwork'" width="100" height="100" /><WorkbenchIcon v-else :name="item.glyph || 'chip'" /><div><small>COMPONENT INFORMATION</small><h2>{{ item.name }}</h2><code>{{ item.type }}</code></div></div><p class="component-description">{{ item.description }}</p><dl v-if="item.metadata" class="metadata-list"><template v-for="(value, key) in item.metadata" :key="key"><dt>{{ key }}</dt><dd>{{ format(value) }}</dd></template></dl><p v-else class="window-note">No device metadata is connected for this entry. Pin labels and electrical parameters are unavailable.</p><p class="window-note">Named functional ports are editor abstractions, not package pin numbers. Placement does not confirm physical hardware or simulation support.</p></template><p v-else class="window-note">Choose a component from the ribbon to inspect its supplied artwork and available metadata.</p></template>
