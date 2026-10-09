export interface CircuitModule {
  id: string
  type: string
  position?: { x?: number; y?: number; z?: number }
  properties?: Record<string, unknown>
}

export interface CircuitConnection {
  source: string
  destination: string
  metadata?: Record<string, unknown>
}

export interface CircuitGraph {
  schema_version: '1.0'
  circuit_id: string
  modules: CircuitModule[]
  connections: CircuitConnection[]
  metadata?: Record<string, unknown>
}
