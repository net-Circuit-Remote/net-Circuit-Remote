export interface LibraryComponent { type: string; name: string; category: string; symbol: string; description: string }
export const componentLibrary: LibraryComponent[] = [
  { type: 'DIGITAL_SWITCH', name: 'Digital switch', category: 'Inputs', symbol: '01', description: 'A logical low/high input for a digital circuit.' },
  { type: 'CLOCK', name: 'Clock source', category: 'Inputs', symbol: '∿', description: 'A periodic digital input. Timing configuration arrives with simulation.' },
  { type: '74HC08', name: '74HC08', category: 'Logic ICs', symbol: '&', description: 'Quad two-input AND gate. A starter functional model exists in the simulator.' },
  { type: 'LED', name: 'Logic indicator', category: 'Outputs', symbol: '◉', description: 'A visual indicator of a logical output.' },
]
