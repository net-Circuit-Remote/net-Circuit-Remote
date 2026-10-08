import { defineStore } from 'pinia'
import type { Experiment, ExperimentState } from '../types/experiment'

export const useExperimentStore = defineStore('experiment', {
  state: () => ({ experiments: [] as Experiment[], activeId: null as string | null, state: 'idle' as ExperimentState }),
  getters: { active: (state): Experiment | null => state.experiments.find((experiment) => experiment.experiment_id === state.activeId) ?? null },
})
