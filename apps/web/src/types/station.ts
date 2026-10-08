import { isRecord } from './api'

export const LAB_STATUSES = ['SIMULATION', 'HARDWARE_AVAILABLE', 'HARDWARE_BUSY', 'HARDWARE_OFFLINE', 'FAULT'] as const
export type LabStatus = typeof LAB_STATUSES[number]
export type HardwareMode = 'simulation' | 'hardware'
export type HardwareState = 'ready' | 'unavailable' | 'busy' | 'error'
export interface StationDescriptor {
  station_id: string
  mode: HardwareMode
  state: HardwareState
}
export interface Station extends StationDescriptor { status: LabStatus }
export function isStationDescriptor(value: unknown): value is StationDescriptor {
  return isRecord(value) && typeof value.station_id === 'string' && value.station_id.trim().length > 0
    && (value.mode === 'simulation' || value.mode === 'hardware')
    && typeof value.state === 'string' && ['ready', 'unavailable', 'busy', 'error'].includes(value.state)
}
export function stationStatus(station: StationDescriptor): LabStatus {
  if (station.state === 'error') return 'FAULT'
  if (station.state === 'unavailable') return 'HARDWARE_OFFLINE'
  if (station.state === 'busy') return 'HARDWARE_BUSY'
  return station.mode === 'simulation' ? 'SIMULATION' : 'HARDWARE_AVAILABLE'
}
