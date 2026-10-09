import type { MemoryImage } from '../../types/memory'

export function parseMemoryImage(text: string): MemoryImage {
  if (text.length > 4096) throw new Error('Memory image exceeds the local 256-byte contract.')
  let value: unknown
  try { value = JSON.parse(text) } catch { throw new Error('Open a valid memory image JSON file.') }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid memory image.')
  const image = value as Record<string, unknown>
  if (Object.keys(image).some((key) => !['version', 'word_bits', 'depth', 'data'].includes(key)) || image.version !== '1.0' || image.word_bits !== 8 || !Number.isInteger(image.depth) || (image.depth as number) < 1 || (image.depth as number) > 256 || !Array.isArray(image.data) || image.data.length !== image.depth || !image.data.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)) throw new Error('Memory image requires 1–256 bytes (00–FF), with data length equal to depth.')
  return image as unknown as MemoryImage
}
export function createMemoryImage(depth = 32): MemoryImage { return parseMemoryImage(JSON.stringify({ version: '1.0', word_bits: 8, depth, data: Array(depth).fill(0) })) }
