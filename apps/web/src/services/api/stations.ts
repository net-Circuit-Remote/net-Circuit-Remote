import { isStationDescriptor, stationStatus, type Station } from '../../types/station'
import { apiClient, ApiError, type ApiClient } from './client'

export function createStationsApi(client: ApiClient) {
  return {
    list(signal?: AbortSignal): Promise<Station[]> {
      return client.request('/stations', {
        signal, parse(value) {
          if (!Array.isArray(value) || !value.every(isStationDescriptor)) {
            throw new ApiError(0, 'INVALID_RESPONSE', 'The API returned invalid station descriptors.')
          }
          return value.map((station) => ({ ...station, status: stationStatus(station) }))
        },
      })
    },
  }
}
export const stationsApi = createStationsApi(apiClient)
