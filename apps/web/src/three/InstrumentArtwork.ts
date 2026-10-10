// Canvas and SVG primitives for authored instrument decals.
export type ArtworkCommand =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; color: string; r?: number }
  | { kind: 'path'; points: [number, number][]; color: string; width: number; dash?: number[] }
  | { kind: 'polygon'; points: [number, number][]; color: string }
  | { kind: 'text'; text: string; x: number; y: number; size: number; color: string; align?: 'left' | 'center' | 'right' }
export interface InstrumentArtwork { width: number; height: number; commands: ArtworkCommand[] }
export function drawInstrumentArtwork(ctx: CanvasRenderingContext2D, artwork: InstrumentArtwork) {
  ctx.clearRect(0, 0, artwork.width, artwork.height)
  ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
  for (const command of artwork.commands) {
    if (command.kind === 'rect') {
      ctx.fillStyle = command.color
      if (command.r && typeof ctx.roundRect === 'function') {
        ctx.beginPath(); ctx.roundRect(command.x, command.y, command.w, command.h, command.r); ctx.fill()
      } else {
        ctx.fillRect(command.x, command.y, command.w, command.h)
      }
    }
    else if (command.kind === 'polygon') {
      ctx.fillStyle = command.color; ctx.beginPath()
      command.points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))
      ctx.closePath(); ctx.fill()
    }
    else if (command.kind === 'text') { ctx.fillStyle = command.color; ctx.font = `500 ${command.size}px Arial, sans-serif`; ctx.textAlign = command.align ?? 'left'; ctx.fillText(command.text, command.x, command.y) }
    else {
      ctx.strokeStyle = command.color; ctx.lineWidth = command.width; ctx.setLineDash(command.dash ?? []); ctx.beginPath()
      command.points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke()
    }
  }
}

// Exporters render this same recipe to PNG, avoiding a second, drifting layout.
export function instrumentArtworkSvg(artwork: InstrumentArtwork): string {
  const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${artwork.width}" height="${artwork.height}" viewBox="0 0 ${artwork.width} ${artwork.height}">${artwork.commands.map((c) => c.kind === 'rect'
    ? `<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}"${c.r ? ` rx="${c.r}" ry="${c.r}"` : ''} fill="${c.color}"/>`
    : c.kind === 'polygon' ? `<polygon points="${c.points.map((p) => p.join(',')).join(' ')}" fill="${c.color}"/>`
    : c.kind === 'text' ? `<text x="${c.x}" y="${c.y}" fill="${c.color}" font-family="Arial, sans-serif" font-size="${c.size}" font-weight="500" text-anchor="${c.align === 'center' ? 'middle' : c.align === 'right' ? 'end' : 'start'}" dominant-baseline="central">${escape(c.text)}</text>`
      : `<polyline points="${c.points.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${c.color}" stroke-width="${c.width}"${c.dash ? ` stroke-dasharray="${c.dash.join(' ')}"` : ''} stroke-linejoin="round" stroke-linecap="round"/>`).join('')}</svg>`
}
