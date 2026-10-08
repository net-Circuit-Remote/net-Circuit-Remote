import { isRecord } from '../../types/api'
import type { Experiment } from '../../types/experiment'
import { apiClient, ApiError, type ApiClient } from './client'

function parseExperiment(value: unknown): Experiment {
  if (!isRecord(value) || typeof value.experiment_id !== 'string' || typeof value.circuit_id !== 'string'
    || typeof value.station_id !== 'string' || typeof value.state !== 'string' || !['idle', 'validating', 'ready', 'running', 'completed', 'fault'].includes(value.state)) {
    throw new ApiError(0, 'INVALID_RESPONSE', 'The API returned an invalid experiment.')
  }
  return value as unknown as Experiment
}
// Reserved for Phase 4; pages do not request these endpoints before backend support.
export function createExperimentsApi(client: ApiClient) {
  return {
    list(signal?: AbortSignal): Promise<Experiment[]> {
      return client.request('/experiments', { signal, parse(value) {
        if (!Array.isArray(value)) throw new ApiError(0, 'INVALID_RESPONSE', 'The API returned an invalid experiment list.')
        return value.map(parseExperiment)
      } })
    },
    get(id: string, signal?: AbortSignal): Promise<Experiment> {
      return client.request(`/experiments/${encodeURIComponent(id)}`, { signal, parse: parseExperiment })
    },
  }
}
export const experimentsApi = createExperimentsApi(apiClient)
