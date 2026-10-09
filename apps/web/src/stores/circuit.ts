import { defineStore } from 'pinia'
import type { CircuitGraph } from '../types/circuit'
import type { CircuitValidation } from '../types/api'
import { circuitsApi } from '../services/api/circuits'
import { errorMessage } from '../services/api/client'
import { MAX_CIRCUIT_FILE_BYTES, parseCircuitFile } from '../services/files/circuitFile'

export interface CircuitDraft { id: string; name: string; graph: CircuitGraph }
export const useCircuitStore = defineStore('circuit', {
  state: () => ({
    drafts: [] as CircuitDraft[], activeId: null as string | null,
    validationResult: null as CircuitValidation | null, validatedSnapshot: '',
    validating: false, validationError: null as string | null, validationVersion: 0,
    past: [] as string[], future: [] as string[], saved: {} as Record<string, string>,
  }),
  getters: {
    current: (state): CircuitDraft | null => state.drafts.find((draft) => draft.id === state.activeId) ?? null,
    graph(): CircuitGraph | null { return this.current?.graph ?? null },
    validation(): CircuitValidation | null { return JSON.stringify(this.graph) === this.validatedSnapshot ? this.validationResult : null },
    canUndo: (state) => state.past.length > 0,
    canRedo: (state) => state.future.length > 0,
    dirty(): boolean { return !!this.current && this.saved[this.current.id] !== JSON.stringify(this.current) },
  },
  actions: {
    snapshot(): string { return JSON.stringify({ drafts: this.drafts, activeId: this.activeId }) },
    recordChange() {
      this.past.push(this.snapshot())
      if (this.past.length > 50) this.past.shift()
      this.future = []
    },
    restore(snapshot: string) {
      const state = JSON.parse(snapshot) as { drafts: CircuitDraft[]; activeId: string | null }
      this.drafts = state.drafts; this.activeId = state.activeId
      this.clearValidation()
    },
    undo() { const previous = this.past.pop(); if (previous) { this.future.push(this.snapshot()); this.restore(previous) } },
    redo() { const next = this.future.pop(); if (next) { this.past.push(this.snapshot()); this.restore(next) } },
    markSaved() { if (this.current) this.saved[this.current.id] = JSON.stringify(this.current) },
    importGraph(graph: CircuitGraph) {
      const copy = parseCircuitFile(JSON.stringify(graph))
      this.recordChange()
      const id = crypto.randomUUID()
      const name = typeof copy.metadata?.name === 'string' && copy.metadata.name.trim() ? copy.metadata.name.trim() : 'Imported circuit'
      this.drafts.push({ id, name, graph: copy })
      this.activeId = id
      this.clearValidation()
      this.markSaved()
    },
    exportGraph(): string {
      if (!this.current) throw new Error('Create or open a circuit first.')
      const graph = { ...this.current.graph, metadata: { ...this.current.graph.metadata, name: this.current.name } }
      const compact = JSON.stringify(graph)
      parseCircuitFile(compact)
      const pretty = JSON.stringify(graph, null, 2)
      return new TextEncoder().encode(pretty).length <= MAX_CIRCUIT_FILE_BYTES ? pretty : compact
    },
    clearValidation() {
      this.validationVersion++
      this.validationResult = null
      this.validationError = null
      this.validatedSnapshot = ''
      this.validating = false
    },
    createDraft(name?: string): string {
      this.recordChange()
      const id = crypto.randomUUID()
      const title = name ?? `Untitled circuit ${this.drafts.length + 1}`
      this.drafts.push({ id, name: title.trim() || 'Untitled circuit', graph: { schema_version: '1.0', circuit_id: id, modules: [], connections: [] } })
      this.activeId = id
      this.clearValidation()
      return id
    },
    openDraft(id: string) {
      if (!this.drafts.some((draft) => draft.id === id)) return
      if (this.activeId === id) return
      this.recordChange()
      this.activeId = id
      this.clearValidation()
    },
    renameCurrent(name: string) {
      if (this.current && name.trim() && this.current.name !== name.trim()) { this.recordChange(); this.current.name = name.trim() }
    },
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
