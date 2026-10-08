import { defineStore } from 'pinia'
import type { CircuitGraph } from '../types/circuit'
import type { CircuitValidation } from '../types/api'
import { circuitsApi } from '../services/api/circuits'
import { errorMessage } from '../services/api/client'

export interface CircuitDraft { id: string; name: string; graph: CircuitGraph }
export const useCircuitStore = defineStore('circuit', {
  state: () => ({
    drafts: [] as CircuitDraft[], activeId: null as string | null,
    validationResult: null as CircuitValidation | null, validatedSnapshot: '',
    validating: false, validationError: null as string | null, validationVersion: 0,
  }),
  getters: {
    current: (state): CircuitDraft | null => state.drafts.find((draft) => draft.id === state.activeId) ?? null,
    graph(): CircuitGraph | null { return this.current?.graph ?? null },
    validation(): CircuitValidation | null { return JSON.stringify(this.graph) === this.validatedSnapshot ? this.validationResult : null },
  },
  actions: {
    clearValidation() {
      this.validationVersion++
      this.validationResult = null
      this.validationError = null
      this.validatedSnapshot = ''
      this.validating = false
    },
    createDraft(name?: string): string {
      const id = crypto.randomUUID()
      const title = name ?? `Untitled circuit ${this.drafts.length + 1}`
      this.drafts.push({ id, name: title.trim() || 'Untitled circuit', graph: { schema_version: '1.0', circuit_id: id, modules: [], connections: [] } })
      this.openDraft(id)
      return id
    },
    openDraft(id: string) {
      if (!this.drafts.some((draft) => draft.id === id)) return
      this.activeId = id
      this.clearValidation()
    },
    renameCurrent(name: string) { if (this.current && name.trim()) this.current.name = name.trim() },
    async validateCurrent() {
      if (!this.graph || this.validating) return
      this.clearValidation()
      const version = this.validationVersion
      const snapshot = JSON.stringify(this.graph)
      this.validating = true
      try {
        const result = await circuitsApi.validate(JSON.parse(snapshot) as CircuitGraph)
        if (version === this.validationVersion && JSON.stringify(this.graph) === snapshot) {
          this.validationResult = result
          this.validatedSnapshot = snapshot
        }
      } catch (error) {
        if (version === this.validationVersion && JSON.stringify(this.graph) === snapshot) this.validationError = errorMessage(error)
      } finally { if (version === this.validationVersion) this.validating = false }
    },
  },
})
