// One drawing recipe drives the live CanvasTextures and the exported PNG decals.
// These two traces are illustrative; no sampling rate, bandwidth or acquisition
// status is inferred from the reference picture or from the visual instrument.
export type ArtworkCommand =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; color: string }
  | { kind: 'path'; points: [number, number][]; color: string; width: number }
  | { kind: 'text'; text: string; x: number; y: number; size: number; color: string; align?: 'left' | 'center' | 'right' }
export interface ScopeArtwork { width: number; height: number; commands: ArtworkCommand[] }
export const CH1_COLOR = '#ffe04a', CH2_COLOR = '#20d4ee'

export function scopeScreenArtwork(): ScopeArtwork {
  const commands: ArtworkCommand[] = [{ kind: 'rect', x: 0, y: 0, w: 1024, h: 704, color: '#050b10' }]
  const line = (points: [number, number][], color: string, width = 1) => commands.push({ kind: 'path', points, color, width })
  const text = (text: string, x: number, y: number, color: string, size = 22) => commands.push({ kind: 'text', text, x, y, color, size })
  // Ten horizontal divisions, eight vertical divisions. Restrained minor ticks
  // leave the channel colors dominant, even when the model is zoomed out.
  for (let i = 0; i <= 10; i++) line([[32 + i * 96, 60], [32 + i * 96, 620]], i === 5 ? '#526570' : '#26363f', i === 5 ? 1.6 : 1)
  for (let i = 0; i <= 8; i++) line([[32, 60 + i * 70], [992, 60 + i * 70]], i === 4 ? '#526570' : '#26363f', i === 4 ? 1.6 : 1)
  for (let x = 32; x <= 992; x += 19.2) line([[x, 337], [x, 343]], '#71838b')
  for (let y = 60; y <= 620; y += 14) line([[509, y], [515, y]], '#71838b')
  const square: [number, number][] = [[32, 264]]
  for (let i = 0; i < 5; i++) {
    const x = 32 + i * 192
    square.push([x + 32, 264], [x + 32, 152], [x + 128, 152], [x + 128, 264], [x + 192, 264])
  }
  line(square, CH1_COLOR, 4)
  line(Array.from({ length: 401 }, (_, i) => [32 + i * 2.4, 484 - Math.sin(i / 400 * Math.PI * 10) * 73] as [number, number]), CH2_COLOR, 4)
  text('CH1', 32, 30, CH1_COLOR); text('CH2', 126, 30, CH2_COLOR)
  text('WAVEFORM PREVIEW', 754, 30, '#91a6af', 17)
  text('CH1', 32, 665, CH1_COLOR, 25); text('CH2', 288, 665, CH2_COLOR, 25)
  line([[250, 642], [250, 686]], '#324651')
  return { width: 1024, height: 704, commands }
}

export function scopeLegendsArtwork(): ScopeArtwork {
  const commands: ArtworkCommand[] = []
  const px = (x: number) => (x / 6 + 0.5) * 1536, py = (y: number) => (1 - y / 3.8) * 960
  const text = (text: string, x: number, y: number, size = 28, color = '#dae3e7', align: 'left' | 'center' = 'center') => commands.push({ kind: 'text', text, x: px(x), y: py(y), size, color, align })
  const line = (a: [number, number], b: [number, number], color = '#b3c2c9', width = 2) => commands.push({ kind: 'path', points: [[px(a[0]), py(a[1])], [px(b[0]), py(b[1])]], color, width })
  const ring = (x: number, y: number, radius: number, color = '#c9d6dc') => {
    for (let i = 0; i <= 10; i++) {
      const angle = -Math.PI * 0.75 + i / 10 * Math.PI * 1.5
      line([x + Math.sin(angle) * radius, y + Math.cos(angle) * radius], [x + Math.sin(angle) * (radius + 0.032), y + Math.cos(angle) * (radius + 0.032)], color)
    }
  }
  text('net*CIRCUIT', -2.40, 3.61, 36, '#dcf3f7', 'left')
  text('2 CHANNEL OSCILLOSCOPE', -0.27, 3.61, 20, '#9cafb9')
  text('Horizontal', 1.04, 3.43, 29, '#e2e9ed', 'left')
  text('Time / Div', 1.35, 2.77, 23); text('Position', 2.02, 2.83, 22)
  text('Auto Set', 2.60, 3.36, 19, '#07181e'); text('Run/Stop', 2.60, 3.10, 19, '#071d17'); text('Single', 2.60, 2.84, 19)
  text('Trigger', 1.04, 2.52, 28, '#e2e9ed', 'left'); text('Level', 1.35, 2.01, 22)
  text('Source', 2.17, 2.32, 19); text('Mode', 2.66, 2.32, 19); text('Slope', 2.42, 2.08, 19)
  text('Vertical', 1.04, 1.85, 27, '#e2e9ed', 'left')
  for (const [x, label, color] of [[1.43, 'CH1', CH1_COLOR], [2.43, 'CH2', CH2_COLOR]] as const) {
    text(label, x, 1.64, 25, color); text('Volts / Div', x, 1.07, 21)
    text('Position', x, 0.51, 21); ring(x, 1.35, 0.24, color); ring(x, 0.77, 0.145, color)
  }
  line([1.93, 0.46], [1.93, 1.71], '#4d626e')
  ring(1.35, 3.10, 0.255, CH2_COLOR); ring(2.02, 3.10, 0.155); ring(1.35, 2.24, 0.19)
  text('CH1', -1.40, 0.72, 28, CH1_COLOR); text('CH2', -0.18, 0.72, 28, CH2_COLOR)
  return { width: 1536, height: 960, commands }
}

export function drawScopeArtwork(ctx: CanvasRenderingContext2D, artwork: ScopeArtwork) {
  ctx.clearRect(0, 0, artwork.width, artwork.height)
  ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
  for (const command of artwork.commands) {
    if (command.kind === 'rect') { ctx.fillStyle = command.color; ctx.fillRect(command.x, command.y, command.w, command.h) }
    else if (command.kind === 'text') { ctx.fillStyle = command.color; ctx.font = `500 ${command.size}px Arial, sans-serif`; ctx.textAlign = command.align ?? 'left'; ctx.fillText(command.text, command.x, command.y) }
    else {
      ctx.strokeStyle = command.color; ctx.lineWidth = command.width; ctx.beginPath()
      command.points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke()
    }
  }
}

// Exporters render this same recipe to PNG, avoiding a second, drifting layout.
export function scopeArtworkSvg(artwork: ScopeArtwork): string {
  const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${artwork.width}" height="${artwork.height}" viewBox="0 0 ${artwork.width} ${artwork.height}">${artwork.commands.map((c) => c.kind === 'rect'
    ? `<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" fill="${c.color}"/>`
    : c.kind === 'text' ? `<text x="${c.x}" y="${c.y}" fill="${c.color}" font-family="Arial, sans-serif" font-size="${c.size}" font-weight="500" text-anchor="${c.align === 'center' ? 'middle' : c.align === 'right' ? 'end' : 'start'}" dominant-baseline="central">${escape(c.text)}</text>`
      : `<polyline points="${c.points.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${c.color}" stroke-width="${c.width}" stroke-linejoin="round" stroke-linecap="round"/>`).join('')}</svg>`
}
