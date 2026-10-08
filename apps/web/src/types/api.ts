export interface HealthResponse {
  status: string
  service: string
  hardware_mode: 'simulation' | 'hardware'
}
export interface CircuitValidation {
  valid: boolean
  code: string
  message: string
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
