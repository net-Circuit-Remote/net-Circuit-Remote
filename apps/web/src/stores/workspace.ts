import { defineStore } from 'pinia'
export type WorkspaceTool = 'select' | 'wire' | 'move' | 'rotate' | 'delete' | 'scope' | 'probe'

export const useWorkspaceStore = defineStore('workspace', {
  state: () => ({ selectedModuleId: null as string | null, previewType: null as string | null, zoom: 100, tool: 'select' as WorkspaceTool }),
  actions: {
    setTool(tool: WorkspaceTool) { this.tool = tool },
    preview(type: string) { this.previewType = type; this.selectedModuleId = null },
    clearSelection() { this.selectedModuleId = null; this.previewType = null },
    setZoom(value: number) { this.zoom = Math.min(200, Math.max(50, value)) },
  },
})
