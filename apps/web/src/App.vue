<script setup lang="ts">
import HardwareStatus from './components/HardwareStatus.vue'
import LabWorkspace from './components/LabWorkspace.vue'
import LogicAnalyzer from './components/LogicAnalyzer.vue'
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <h1>net*CIRCUIT Remote</h1>
        <p>Remote digital electronics laboratory</p>
      </div>
      <HardwareStatus />
    </header>

    <nav class="toolbox" aria-label="Lab toolbox">
      <button>Input</button><button>Clock</button><button>Logic IC</button>
      <button>Output</button><button>Instrument</button>
    </nav>

    <LabWorkspace />
    <LogicAnalyzer />
  </main>
</template>
