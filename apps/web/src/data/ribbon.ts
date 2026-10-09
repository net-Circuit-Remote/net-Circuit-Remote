import type { WindowKind } from '../types/windows'
import deviceMetadata from './deviceMetadata.json'

export const iconUrl = (filename: string) => new URL(`../assets/icons/${filename}.svg`, import.meta.url).href
export interface LibraryComponent {
  type: string; name: string; description: string; icon?: string; glyph?: string; window?: WindowKind
  metadata?: Record<string, unknown>
}
export interface RibbonGroup { id: string; label: string; icon?: string; glyph?: string; items: LibraryComponent[] }
const artwork = (type: string, name: string, icon: string): LibraryComponent => ({ type, name, icon, description: 'Supplied artwork preview. Placement and model integration are planned for the circuit editor.' })
const future = (type: string, name: string, glyph: string): LibraryComponent => ({ type, name, glyph, description: 'Reserved library entry. Device metadata and editor integration are not connected yet.' })
export const ribbonGroups: RibbonGroup[] = [
  { id: 'structure', label: 'Structure', icon: 'breadboard_830', items: [
    { ...artwork('BREADBOARD', 'Breadboard', 'breadboard_830'), metadata: deviceMetadata['generic-full-size'] },
    artwork('JUMPER', 'Jumper wire', 'Line'),
  ] },
  { id: 'passive', label: 'Passive', icon: 'resistor', items: [artwork('RESISTOR', 'Resistor', 'resistor'), artwork('CAPACITOR', 'Capacitor', 'capacitor')] },
  { id: 'active', label: 'Active', icon: 'transistor', items: [artwork('TRANSISTOR', 'Transistor', 'transistor'), artwork('DIODE', 'Diode', 'diode'), artwork('ZENER', 'Zener diode', 'diode_zener')] },
  { id: 'output', label: 'Output', icon: 'led', items: [artwork('LED', 'LED indicator', 'led'), artwork('BUZZER', 'Buzzer', 'buzzer_chip')] },
  { id: 'input', label: 'Input', glyph: 'switch', items: [future('DIGITAL_SWITCH', 'Digital switch', 'switch'), future('CLOCK', 'Clock', 'clock'), artwork('POWER_SUPPLY', 'Power supply', 'power_supply')] },
  { id: 'logic', label: 'Logic ICs', icon: 'ic_logic', items: [
    { type: '74HC08', name: '74HC08 · AND', icon: 'ic_logic', description: 'Quad two-input AND gate. Starter logical metadata only; browser simulation integration is pending.', metadata: deviceMetadata['74HC08'] },
  ] },
  { id: 'arithmetic', label: 'Arithmetic ICs', icon: 'ic_arithmetic', items: [artwork('ARITHMETIC', 'Arithmetic IC', 'ic_arithmetic')] },
  { id: 'memory', label: 'Memory', glyph: 'memory', items: [{ ...future('MEMORY', 'Memory editor', 'memory'), window: 'hex-editor' }] },
  { id: 'display', label: 'Display', icon: '7doan1', items: [artwork('SEGMENT_1', '7-segment · single', '7doan1'), artwork('SEGMENT_2', '7-segment · dual', '7doan2'), artwork('SEGMENT_4', '7-segment · quad', '7doan4')] },
  { id: 'embedded', label: 'Embedded/Controller', glyph: 'chip', items: [future('CONTROLLER', 'Controller', 'chip')] },
  { id: 'instruments', label: 'Instruments', icon: 'Oscillocrope', items: [
    { type: 'OSCILLOSCOPE', name: 'Oscilloscope', icon: 'Oscillocrope', description: 'Acquisition window shell.', window: 'oscilloscope' },
    { type: 'GENERATOR', name: 'Function Generator', icon: 'Generator', description: 'Generator configuration shell.', window: 'generator' },
    { type: 'SIGNAL_MONITOR', name: 'Signal Monitor', glyph: 'monitor', description: 'Digital acquisition window shell.', window: 'monitor' },
  ] },
  { id: 'notation', label: 'Notation', glyph: 'tag', items: [future('LABEL', 'Label', 'tag'), future('PROBE', 'Probe annotation', 'probe')] },
]
export const libraryComponents = ribbonGroups.flatMap((group) => group.items)
