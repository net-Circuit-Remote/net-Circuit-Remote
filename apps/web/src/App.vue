<script setup lang="ts">
import HardwareStatus from './components/HardwareStatus.vue'
import { RouterLink, RouterView } from 'vue-router'
import { navigation } from './router'
import { useUiStore } from './stores/ui'
import { useLabConnection } from './composables/useLabConnection'
const ui = useUiStore()
useLabConnection()
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">Skip to content</a>
    <header class="topbar">
      <RouterLink to="/" class="brand" aria-label="net*CIRCUIT Remote home">
        <span class="brand-mark" aria-hidden="true">nC</span>
        <span><strong>net*CIRCUIT <span class="brand-light">Remote</span></strong><small>DIGITAL ELECTRONICS LAB</small></span>
      </RouterLink>
      <nav class="main-nav" aria-label="Main navigation">
        <RouterLink v-for="item in navigation" :key="item.path" :to="item.path" active-class="" exact-active-class="nav-active">{{ item.label }}</RouterLink>
      </nav>
      <div class="topbar-status"><HardwareStatus /><span class="connection" :class="{ connected: ui.connectionState === 'connected' }" role="status"><i />Events: {{ ui.connectionState }}</span></div>
    </header>
    <main id="main-content" class="main-content" tabindex="-1"><RouterView /></main>
    <footer class="app-footer"><span>net*CIRCUIT Remote <span class="muted">/ Web Foundation</span></span><span>Schema 1.0 <span class="footer-dot">·</span> Simulation first</span></footer>
  </div>
</template>
