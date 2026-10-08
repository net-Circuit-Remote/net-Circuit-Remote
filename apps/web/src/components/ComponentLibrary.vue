<script setup lang="ts">
import { computed, ref } from 'vue'
import { componentLibrary } from '../data/componentLibrary'
import { useWorkspaceStore } from '../stores/workspace'
const workspace = useWorkspaceStore()
const query = ref('')
const filtered = computed(() => componentLibrary.filter((item) => `${item.name} ${item.category}`.toLowerCase().includes(query.value.toLowerCase())))
</script>
<template>
  <aside class="panel component-library" aria-label="Component Library">
    <header class="panel-header"><h2>Component Library</h2><span class="count">{{ componentLibrary.length }}</span></header>
    <div class="panel-body">
      <label class="search-field"><span class="sr-only">Search components</span><input v-model="query" type="search" placeholder="Search components…" /></label>
      <p class="eyebrow library-label">LOGICAL COMPONENTS</p>
      <button v-for="item in filtered" :key="item.type" class="component-item" :class="{ selected: workspace.previewType === item.type }" :aria-pressed="workspace.previewType === item.type" @click="workspace.preview(item.type)">
        <span class="component-symbol" aria-hidden="true">{{ item.symbol }}</span><span><strong>{{ item.name }}</strong><small>{{ item.category }}</small></span><span class="chevron" aria-hidden="true">›</span>
      </button>
      <p v-if="!filtered.length" class="muted">No matching components.</p>
    </div>
    <div class="panel-note"><span class="eyebrow">LIBRARY PREVIEW</span><p>Select a component to inspect it. Placement and wiring arrive in Phase 2.</p></div>
  </aside>
</template>
