import type { CircuitGraph } from '../types/circuit'

const API_BASE = '/api'

export async function health(): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_BASE}/health`)
  if (!response.ok) throw new Error(`Health request failed: ${response.status}`)
  return response.json()
}

export async function validateCircuit(circuit: CircuitGraph): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_BASE}/circuits/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(circuit)
  })
  return response.json()
}
