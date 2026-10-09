export const windowDefinitions = {
  oscilloscope: { title: 'Oscilloscope', width: 540, height: 400 },
  generator: { title: 'Function Generator', width: 420, height: 400 },
  monitor: { title: 'Signal Monitor', width: 500, height: 380 },
  'component-info': { title: 'Component Info', width: 380, height: 390 },
  inspector: { title: 'Inspector', width: 400, height: 470 },
  'hex-editor': { title: 'Hex Editor', width: 470, height: 330 },
} as const
export type WindowKind = keyof typeof windowDefinitions
export interface WorkspaceWindow {
  kind: WindowKind; open: boolean; x: number; y: number; width: number; height: number; z: number; activation: number
}
