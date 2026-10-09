<script setup lang="ts">
import { useInstrumentStore } from '../../stores/instrument'
const instrument = useInstrumentStore()
</script>
<template><div class="instrument-heading"><span class="instrument-id">DIGITAL / 01</span><span class="empty-source">NO TRACE DATA</span></div><div class="monitor-screen"><div class="monitor-channel-list">CHANNELS<small>No channels configured</small></div><svg viewBox="0 0 310 175" role="img" aria-label="Empty signal monitor; no acquired traces"><path v-for="y in [35, 70, 105, 140]" :key="y" :d="`M0 ${y}H310`" stroke="#293c49" stroke-dasharray="3 5" /></svg></div><fieldset disabled class="instrument-controls"><label>Time scale<select v-model="instrument.monitor.timeScale"><option>1 ms</option></select></label><label>Trigger<select><option>Not configured</option></select></label><button>Run / Pause</button></fieldset><p class="window-note">Attach logical signals after the editor and capture API are available.</p></template>
