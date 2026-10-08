import { defineStore } from 'pinia'
import type { ConnectionState } from '../services/websocket/client'

export const useUiStore = defineStore('ui', {
  state: () => ({ libraryVisible: true, inspectorVisible: true, dockVisible: true, connectionState: 'idle' as ConnectionState }),
})
