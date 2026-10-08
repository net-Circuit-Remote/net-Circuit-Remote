<script setup lang="ts">
import { useCircuitStore } from '../stores/circuit'
import { useWorkspaceStore } from '../stores/workspace'
const circuit = useCircuitStore()
const workspace = useWorkspaceStore()
</script>
<template>
  <section class="panel lab-workspace" aria-label="Lab Workspace">
    <header class="workspace-toolbar"><div class="tool-group"><button class="tool-button" :class="{ active: workspace.tool === 'select' }" :aria-pressed="workspace.tool === 'select'" @click="workspace.tool = 'select'">Select</button><button class="tool-button" :class="{ active: workspace.tool === 'pan' }" :aria-pressed="workspace.tool === 'pan'" @click="workspace.tool = 'pan'">Pan</button></div><span class="eyebrow">WORKSPACE PREVIEW</span><div class="zoom-controls"><button aria-label="Zoom out" @click="workspace.setZoom(workspace.zoom - 10)">−</button><output aria-label="Workspace zoom">{{ workspace.zoom }}%</output><button aria-label="Zoom in" @click="workspace.setZoom(workspace.zoom + 10)">+</button></div></header>
    <div class="workspace-stage">
      <div class="stage-coordinate mono">X 0.00 <span>Y 0.00</span></div>
      <div class="workspace-empty">
        <div class="board-preview" :style="{ width: `${Math.min(100, workspace.zoom / 1.4)}%` }" aria-hidden="true"><div class="board-rail" /><div class="board-holes" /><div class="board-gap" /><div class="board-holes" /><div class="board-rail bottom" /></div>
        <span class="eyebrow">YOUR LAB STARTS HERE</span><h2>{{ circuit.current ? 'A blank canvas for your circuit' : 'Create your first circuit' }}</h2><p>Build a logical circuit, inspect its properties,<br />and prepare it for a virtual experiment.</p>
        <button v-if="!circuit.current" class="button primary" @click="circuit.createDraft()">+ New circuit</button><span v-else class="phase-note">3D placement & wiring · Phase 2</span>
      </div>
    </div>
    <footer class="workspace-footer"><span><i class="tiny-dot" />{{ circuit.current ? 'Session draft' : 'No active circuit' }}</span><span class="mono">{{ circuit.graph?.modules.length ?? 0 }} modules · {{ circuit.graph?.connections.length ?? 0 }} connections</span></footer>
  </section>
</template>
