<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useCircuitStore } from '../../stores/circuit'
import { useUiStore } from '../../stores/ui'
import { useInstrumentStore } from '../../stores/instrument'
import { MAX_CIRCUIT_FILE_BYTES, parseCircuitFile } from '../../services/files/circuitFile'
import { iconUrl } from '../../data/ribbon'
import WorkbenchIcon from './WorkbenchIcon.vue'
const circuit = useCircuitStore()
const ui = useUiStore()
const instrument = useInstrumentStore()
const fileInput = ref<HTMLInputElement>()
const error = ref('')
let readVersion = 0, disposed = false
const newFile = () => { readVersion++; if (fileInput.value) fileInput.value.value = ''; circuit.createDraft(); error.value = '' }
async function openFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const version = ++readVersion
  try {
    if (file.size > MAX_CIRCUIT_FILE_BYTES) throw new Error('Circuit file is too large (maximum 2 MB).')
    const contents = await file.text()
    if (disposed || version !== readVersion) return
    circuit.importGraph(parseCircuitFile(contents))
    error.value = ''
    instrument.log(`Opened ${file.name} locally.`)
  } catch (reason) { if (!disposed && version === readVersion) error.value = reason instanceof Error ? reason.message : 'Cannot open circuit file.' }
  finally { if (version === readVersion) input.value = '' }
}
function saveFile() {
  if (!circuit.current) return
  try {
    const url = URL.createObjectURL(new Blob([circuit.exportGraph()], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${circuit.current.name.replace(/[^\p{L}\p{N}_.-]/gu, '_').slice(0, 80) || 'circuit'}.json`
    document.body.append(link)
    try { link.click() } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 0) }
    circuit.markSaved()
    error.value = ''
    instrument.log('Circuit JSON download requested. Projects remain local to this browser session.')
  } catch (reason) { error.value = reason instanceof Error ? reason.message : 'Cannot save circuit file.' }
}
function shortcuts(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [contenteditable="true"]') || !(event.ctrlKey || event.metaKey)) return
  const key = event.key.toLowerCase()
  if (!['n', 'o', 's', 'z', 'y'].includes(key)) return
  event.preventDefault()
  if (key === 'n') newFile()
  if (key === 'o') fileInput.value?.click()
  if (key === 's') saveFile()
  if (key === 'z') event.shiftKey ? circuit.redo() : circuit.undo()
  if (key === 'y') circuit.redo()
}
onMounted(() => window.addEventListener('keydown', shortcuts))
onUnmounted(() => { disposed = true; readVersion++; window.removeEventListener('keydown', shortcuts) })
</script>
<template>
  <header class="app-titlebar">
    <div class="brand" aria-label="net*CIRCUIT Remote"><span class="brand-mark"><img :src="iconUrl('favicon')" alt="net*CIRCUIT Remote" width="38" height="38" /></span><strong>net<span class="brand-circuit">*CIRCUIT</span> <span class="brand-remote">Remote</span></strong></div>
    <div class="file-actions" role="toolbar" aria-label="File actions">
      <button title="New circuit (Ctrl+N)" @click="newFile"><WorkbenchIcon name="new" />New</button>
      <button title="Open Circuit Graph JSON (Ctrl+O)" @click="fileInput?.click()"><WorkbenchIcon name="open" />Open</button>
      <button title="Save Circuit Graph JSON (Ctrl+S)" :disabled="!circuit.current" @click="saveFile"><WorkbenchIcon name="save" />Save</button>
      <span class="toolbar-divider" />
      <button title="Undo (Ctrl+Z)" :disabled="!circuit.canUndo" @click="circuit.undo()"><WorkbenchIcon name="undo" />Undo</button>
      <button title="Redo (Ctrl+Shift+Z)" :disabled="!circuit.canRedo" @click="circuit.redo()"><WorkbenchIcon name="redo" />Redo</button>
    </div>
    <div class="project-title" :title="circuit.current?.name || 'No circuit'"><span class="dirty-dot" v-if="circuit.dirty" aria-label="Unsaved changes" />{{ circuit.current?.name || 'No circuit open' }}<small>LOCAL JSON</small></div>
    <button class="inspector-toggle" title="Open Inspector" aria-label="Open Inspector" @click="ui.openWindow('inspector')"><WorkbenchIcon name="inspector" /><span>Inspector</span></button>
    <input ref="fileInput" class="visually-hidden" type="file" accept=".json,application/json" aria-label="Open circuit file" @change="openFile" />
  </header>
  <div v-if="error" class="file-error" role="alert">{{ error }}<button aria-label="Dismiss file error" @click="error = ''"><WorkbenchIcon name="close" /></button></div>
</template>
