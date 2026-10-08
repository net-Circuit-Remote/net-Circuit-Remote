import { isRecord, type HealthResponse } from '../types/api'
import { apiClient, ApiError } from './api/client'
export { circuitsApi, validateCircuit } from './api/circuits'
export { stationsApi } from './api/stations'
export { experimentsApi } from './api/experiments'
export { ApiError } from './api/client'

export function health(signal?: AbortSignal): Promise<HealthResponse> {
  return apiClient.request('/health', { signal, parse(value) {
    if (!isRecord(value) || typeof value.status !== 'string' || typeof value.service !== 'string'
      || (value.hardware_mode !== 'simulation' && value.hardware_mode !== 'hardware')) {
      throw new ApiError(0, 'INVALID_RESPONSE', 'The API returned an invalid health response.')
    }
    return { status: value.status, service: value.service, hardware_mode: value.hardware_mode }
  } })
}
