import { defineStore } from 'pinia'

export const useWorkspaceStore = defineStore('workspace', {
  state: () => ({ selectedModuleId: null as string | null, previewType: null as string | null, zoom: 100, tool: 'select' as 'select' | 'pan' }),
  actions: {
    preview(type: string) { this.previewType = type; this.selectedModuleId = null },
    clearSelection() { this.selectedModuleId = null; this.previewType = null },
    setZoom(value: number) { this.zoom = Math.min(200, Math.max(50, value)) },
  },
})
