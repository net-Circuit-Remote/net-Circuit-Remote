<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCircuitStore } from '../../stores/circuit'
import { useWorkspaceStore } from '../../stores/workspace'
import { createMemoryImage, parseMemoryImage } from '../../services/files/memoryImage'
import type { MemoryImage } from '../../types/memory'
const circuit = useCircuitStore(), workspace = useWorkspaceStore()
const selected = computed(() => circuit.graph?.modules.find((module) => module.id === workspace.selectedModuleId && module.type === 'MEMORY'))
const image = computed(() => selected.value?.properties?.memory as MemoryImage | undefined)
const hex = ref(''), error = ref(''), file = ref<HTMLInputElement>()
const rows = computed(() => image.value ? Array.from({ length: Math.ceil(image.value.depth / 8) }, (_, i) => ({ address: (i * 8).toString(16).toUpperCase().padStart(4, '0'), bytes: image.value!.data.slice(i * 8, i * 8 + 8).map((byte) => byte.toString(16).toUpperCase().padStart(2, '0')).join(' '), ascii: image.value!.data.slice(i * 8, i * 8 + 8).map((byte) => byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.').join('') })) : [])
watch(image, (value) => { hex.value = value?.data.map((byte) => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ') ?? ''; error.value = '' }, { immediate: true, deep: true })
function apply() {
  try {
    if (!selected.value) return
    const tokens = hex.value.trim().split(/\s+/)
    if (!tokens.every((token) => /^[0-9a-f]{2}$/i.test(token))) throw new Error('Enter two-digit hex bytes separated by spaces (00–FF).')
    circuit.setMemoryImage(selected.value.id, { version: '1.0', word_bits: 8, depth: tokens.length, data: tokens.map((token) => parseInt(token, 16)) }); error.value = ''
  } catch (reason) { error.value = reason instanceof Error ? reason.message : 'Invalid memory data.' }
}
async function load(event: Event) {
  const input = event.target as HTMLInputElement, entry = input.files?.[0], id = selected.value?.id, draft = circuit.activeId
  try {
    if (!entry || !id) return
    if (entry.size > 4096) throw new Error('Memory image file is too large.')
    const next = parseMemoryImage(await entry.text())
    if (circuit.activeId !== draft || selected.value?.id !== id) throw new Error('Selection changed while opening the image. Open it again for the intended memory.')
    circuit.setMemoryImage(id, next); error.value = ''
  } catch (reason) { error.value = reason instanceof Error ? reason.message : 'Cannot open image.' }
  finally { input.value = '' }
}
function save() {
  if (!image.value || !selected.value) return
  const url = URL.createObjectURL(new Blob([JSON.stringify(image.value, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a'); link.href = url; link.download = `${selected.value.id}-memory.json`; document.body.append(link)
  try { link.click() } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 0) }
}
</script>
<template>
  <div class="instrument-heading"><span class="instrument-id">MEMORY / HEX</span><span class="empty-source">LOCAL INITIAL IMAGE</span></div>
  <template v-if="selected"><strong>{{ selected.id }}</strong><p class="window-note">Local byte image v1.0 · 8-bit words · {{ image?.depth || 0 }} bytes. This configuration is independent of physical RAM and captured data.</p>
    <button v-if="!image" @click="circuit.setMemoryImage(selected.id, createMemoryImage())">Initialize 32 zero bytes</button>
    <template v-else><div class="hex-header"><span>ADDRESS</span><code>00 01 02 03 04 05 06 07</code><span>ASCII</span></div><div v-for="row in rows" :key="row.address" class="hex-row"><code>{{ row.address }}</code><code>{{ row.bytes }}</code><code>{{ row.ascii }}</code></div><label class="hex-input">Hex bytes (1–256)<textarea v-model="hex" rows="4" maxlength="767" spellcheck="false" /></label></template>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p><div class="hex-actions"><button @click="file?.click()">Load image JSON</button><button :disabled="!image" @click="save">Save image JSON</button><button :disabled="!image" @click="apply">Apply hex bytes</button></div>
    <input ref="file" type="file" class="visually-hidden" accept=".json,application/json" aria-label="Open memory image" @change="load" />
  </template><div v-else class="hex-empty"><strong>Select a generic memory component</strong><p>Place Memory from the ribbon, then select it to edit its local image.</p></div>
</template>
