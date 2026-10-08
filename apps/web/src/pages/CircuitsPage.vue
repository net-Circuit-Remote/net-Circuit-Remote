<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCircuitStore } from '../stores/circuit'
import ValidationNotice from '../components/ValidationNotice.vue'
const circuit = useCircuitStore()
const router = useRouter()
const name = ref('')
function create() { circuit.createDraft(name.value); name.value = ''; void router.push('/laboratory') }
function open(id: string) { circuit.openDraft(id); void router.push('/laboratory') }
</script>
<template>
  <div class="content-page"><header class="page-heading"><div><p class="eyebrow">CIRCUIT COLLECTION</p><h1>Circuits</h1><p class="muted">Organize the logical graphs for your experiments.</p></div><span class="phase-note">{{ circuit.drafts.length }} session drafts</span></header>
    <section class="panel create-circuit"><div><h2>Start with a new circuit</h2><p class="muted">Drafts stay in this browser session. Reloading clears them.</p></div><form @submit.prevent="create"><label class="sr-only" for="circuit-name">Circuit name</label><input id="circuit-name" v-model="name" maxlength="100" placeholder="Circuit name" /><button class="button primary" type="submit">+ New circuit</button></form></section>
    <ValidationNotice />
    <section v-if="circuit.drafts.length" class="circuit-list" aria-label="Circuit drafts"><article v-for="draft in circuit.drafts" :key="draft.id" class="panel circuit-card"><span class="card-icon" aria-hidden="true">⌘</span><div class="card-main"><h2>{{ draft.name }}</h2><p class="muted mono">{{ draft.graph.modules.length }} modules · {{ draft.graph.connections.length }} connections</p><small class="muted">Schema 1.0 · Session draft</small></div><button class="button" @click="open(draft.id)">Open in lab →</button></article></section>
    <div v-else class="panel page-empty"><span class="empty-icon" aria-hidden="true">⌘</span><h2>Your circuit collection is empty</h2><p>Create a draft to begin. Circuit persistence will arrive with the application backend.</p></div>
    <section v-if="circuit.current" class="panel current-circuit"><h2>Current circuit</h2><label for="rename-circuit">Circuit name</label><input id="rename-circuit" :value="circuit.current.name" maxlength="100" @change="circuit.renameCurrent(($event.target as HTMLInputElement).value)" /><button class="button" :disabled="circuit.validating" @click="circuit.validateCurrent()">{{ circuit.validating ? 'Validating…' : 'Validate current graph' }}</button></section>
  </div>
</template>
