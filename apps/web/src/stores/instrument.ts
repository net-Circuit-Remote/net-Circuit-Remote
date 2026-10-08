import { defineStore } from 'pinia'

export type DockTab = 'instruments' | 'logic-analyzer' | 'console'
export interface ConsoleEntry { id: number; time: string; level: 'info' | 'error'; message: string }
export const useInstrumentStore = defineStore('instrument', {
  state: () => ({ activeTab: 'instruments' as DockTab, entries: [] as ConsoleEntry[], nextEntryId: 1 }),
  actions: {
    log(message: string, level: ConsoleEntry['level'] = 'info') {
      this.entries.push({ id: this.nextEntryId++, time: new Date().toLocaleTimeString(), level, message })
      if (this.entries.length > 100) this.entries.shift()
    },
    clearConsole() { this.entries = [] },
  },
})
