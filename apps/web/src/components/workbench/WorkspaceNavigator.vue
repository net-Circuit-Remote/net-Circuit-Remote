<script setup lang="ts">
import type { OrientationAxis } from '../../three/SceneManager'
import WorkbenchIcon from './WorkbenchIcon.vue'
defineProps<{ axes: OrientationAxis[] }>()
const emit = defineEmits<{ orbit: [degrees: number]; pan: [horizontal: number, forward: number] }>()
function arrow(axis: OrientationAxis) {
  const length = Math.hypot(axis.x, axis.y), ux = axis.x / length, uy = axis.y / length
  const x = 52 + axis.x * 31, y = 52 + axis.y * 31
  return `${x},${y} ${x - ux * 8 - uy * 3.5},${y - uy * 8 + ux * 3.5} ${x - ux * 8 + uy * 3.5},${y - uy * 8 - ux * 3.5}`
}
</script>
<template>
  <div class="workspace-navigator" role="group" aria-label="Workspace navigation">
    <div class="axis-navigation" role="toolbar" aria-label="Orbit and pan controls">
      <button class="nav-orbit-left" aria-label="Orbit left" title="Orbit left" @click="emit('orbit', -15)"><WorkbenchIcon name="orbit-left" /></button>
      <button class="nav-forward" aria-label="Pan forward" title="Pan forward" @click="emit('pan', 0, -0.5)"><WorkbenchIcon name="pan-forward" /></button>
      <button class="nav-orbit-right" aria-label="Orbit right" title="Orbit right" @click="emit('orbit', 15)"><WorkbenchIcon name="orbit-right" /></button>
      <button class="nav-left" aria-label="Pan left" title="Pan left" @click="emit('pan', -0.5, 0)"><WorkbenchIcon name="pan-left" /></button>
      <span class="nav-center" aria-hidden="true">XZ</span>
      <button class="nav-right" aria-label="Pan right" title="Pan right" @click="emit('pan', 0.5, 0)"><WorkbenchIcon name="pan-right" /></button>
      <button class="nav-back" aria-label="Pan back" title="Pan back" @click="emit('pan', 0, 0.5)"><WorkbenchIcon name="pan-back" /></button>
    </div>
    <svg viewBox="0 0 104 104" class="axis-gizmo" role="img" aria-label="World XYZ axes relative to camera">
      <title>World axes follow the camera orientation</title>
      <circle cx="52" cy="52" r="44" class="axis-guide" />
      <g v-for="axis in axes" :key="axis.label" :data-axis="axis.label" :fill="axis.color" :stroke="axis.color">
        <line x1="52" y1="52" :x2="52 - axis.x * 23" :y2="52 - axis.y * 23" stroke-width="1.2" stroke-dasharray="2 3" opacity="0.3" />
        <line x1="52" y1="52" :x2="52 + axis.x * 31" :y2="52 + axis.y * 31" stroke-width="2.8" stroke-linecap="round" />
        <polygon v-if="Math.hypot(axis.x, axis.y) > 0.12" :points="arrow(axis)" stroke="none" />
        <circle v-else cx="52" cy="52" r="3.5" stroke="none" />
        <text :x="52 + axis.x * 42 + (Math.hypot(axis.x, axis.y) <= 0.12 ? 10 : 0)" :y="52 + axis.y * 42" stroke="none" text-anchor="middle" dominant-baseline="central">{{ axis.label }}</text>
      </g>
      <circle cx="52" cy="52" r="3" fill="#d7e5ef" />
    </svg>
  </div>
</template>
