<script setup lang="ts">
import { useCircuitStore } from '../stores/circuit'
const circuit = useCircuitStore()
</script>
<template>
  <p v-if="circuit.validationError" class="notice error" role="alert">{{ circuit.validationError }}</p>
  <p v-else-if="circuit.validation" class="notice" :class="circuit.validation.valid ? 'success' : 'error'" role="status"><strong>{{ circuit.validation.code }}</strong> · {{ circuit.validation.message }}</p>
</template>
