import { defineStore } from 'pinia'

export type HardwareMode = 'simulation' | 'hardware'
export type HardwareState = 'ready' | 'unavailable' | 'busy' | 'error'

export const useStationStore = defineStore('station', {
  state: () => ({
    mode: 'simulation' as HardwareMode,
    state: 'ready' as HardwareState,
    stationId: 'virtual-station-01'
  })
})
