export type ExperimentState = 'idle' | 'validating' | 'ready' | 'running' | 'completed' | 'fault'
export interface Experiment {
  experiment_id: string
  circuit_id: string
  station_id: string
  state: ExperimentState
}
