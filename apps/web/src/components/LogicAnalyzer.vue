<template>
  <section class="logic-analyzer">
    <header>Logic Analyzer</header>
    <div v-for="channel in 4" :key="channel" class="trace">
      <span>CH{{ channel - 1 }}</span>
      <div class="digital-wave" />
    </div>
    <small>Virtual waveform renderer placeholder</small>
  </section>
</template>
