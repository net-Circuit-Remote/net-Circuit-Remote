import { defineStore } from 'pinia'
export type WorkspaceTool = 'select' | 'wire' | 'move' | 'rotate' | 'delete' | 'scope' | 'probe'

export const useWorkspaceStore = defineStore('workspace', {
  state: () => ({ selectedModuleId: null as string | null, selectedWire: null as { source: string; destination: string } | null, pendingPort: null as string | null, previewType: null as string | null, placementType: null as string | null, snap: true, zoom: 100, fitRequest: 0, tool: 'select' as WorkspaceTool, editError: '' }),
  actions: {
    setTool(tool: WorkspaceTool) { this.tool = tool; this.cancelPlacement() },
    preview(type: string) { this.previewType = type; this.selectedModuleId = null },
    armPlacement(type: string) { this.clearSelection(); this.previewType = type; this.placementType = type; this.tool = 'select'; this.editError = '' },
    selectModule(id: string | null) { this.selectedModuleId = id; this.selectedWire = null; this.placementType = null; this.editError = '' },
    selectWire(source: string, destination: string) { this.selectedModuleId = null; this.selectedWire = { source, destination }; this.placementType = null },
    cancelPlacement() { this.placementType = null; this.pendingPort = null },
    clearSelection() { this.selectedModuleId = null; this.selectedWire = null; this.previewType = null; this.cancelPlacement(); this.editError = '' },
    setZoom(value: number) { if (Number.isFinite(value)) this.zoom = Math.min(200, Math.max(50, value)) },
    fitEntireCircuit() { this.zoom = 100; this.fitRequest++ },
  },
})
