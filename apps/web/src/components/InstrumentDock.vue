<script setup lang="ts">
import LogicAnalyzer from './LogicAnalyzer.vue'
import { useInstrumentStore, type DockTab } from '../stores/instrument'
const instrument = useInstrumentStore()
const tabs: { id: DockTab; label: string }[] = [{ id: 'instruments', label: 'Instruments' }, { id: 'logic-analyzer', label: 'Logic Analyzer' }, { id: 'console', label: 'Console' }]
function navigate(event: KeyboardEvent, index: number) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
  instrument.activeTab = tabs[next].id
  document.getElementById(`dock-tab-${tabs[next].id}`)?.focus()
}
</script>
<template>
  <section class="panel instrument-dock" aria-label="Instrument dock">
    <header class="dock-header"><div class="dock-tabs" role="tablist" aria-label="Instrument panels"><button v-for="(tab, index) in tabs" :key="tab.id" :id="`dock-tab-${tab.id}`" role="tab" :aria-selected="instrument.activeTab === tab.id" :aria-controls="`dock-panel-${tab.id}`" :tabindex="instrument.activeTab === tab.id ? 0 : -1" :class="{ active: instrument.activeTab === tab.id }" @click="instrument.activeTab = tab.id" @keydown="navigate($event, index)">{{ tab.label }}<span v-if="tab.id === 'console' && instrument.entries.length" class="count">{{ instrument.entries.length }}</span></button></div><span class="eyebrow dock-caption">MEASUREMENT & EVENTS</span></header>
    <div v-for="tab in tabs" :key="tab.id" :id="`dock-panel-${tab.id}`" role="tabpanel" :aria-labelledby="`dock-tab-${tab.id}`" :hidden="instrument.activeTab !== tab.id" tabindex="0">
      <div v-if="tab.id === 'instruments'" class="empty-dock"><span class="instrument-glyph" aria-hidden="true">⌁</span><div><h3>Instrument workspace</h3><p>Available instruments will follow the selected station's capabilities.</p></div><span class="phase-note">No instrument connected</span></div>
      <LogicAnalyzer v-else-if="tab.id === 'logic-analyzer'" />
      <div v-else class="console-panel"><div class="console-actions"><span class="muted">Application events</span><button class="button subtle" @click="instrument.clearConsole()">Clear</button></div><p v-if="!instrument.entries.length" class="muted">No events yet.</p><ol v-else class="console-entries" aria-label="Console events"><li v-for="entry in instrument.entries" :key="entry.id" :class="entry.level"><time class="mono">{{ entry.time }}</time><span>{{ entry.message }}</span></li></ol></div>
    </div>
  </section>
</template>
