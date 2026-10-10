import { build } from 'esbuild'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { Group, Mesh } from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

// Offline authoring tool. sharp is only a PNG rasterizer here, never a browser
// dependency. npm ci supplies it, or use --sharp-module /absolute/path/to/sharp.
const require = createRequire(import.meta.url)
const argument = process.argv.indexOf('--sharp-module')
const sharp = require(argument >= 0 ? process.argv[argument + 1] : 'sharp')
const web = new URL('../', import.meta.url)
const source = (name) => fileURLToPath(new URL(`src/three/${name}.ts`, web))
const temp = new URL('.test-build/scope-export/', web)
await mkdir(temp, { recursive: true })
await build({ entryPoints: [source('OscilloscopeModel'), source('OscilloscopeArtwork')], outdir: fileURLToPath(temp), outExtension: { '.js': '.mjs' }, bundle: true, packages: 'external', platform: 'node', format: 'esm' })
const { addOscilloscopeModel, OSCILLOSCOPE_SIZE, OSCILLOSCOPE_KNOBS } = await import(new URL('OscilloscopeModel.mjs', temp).href)
const { scopeArtworkSvg, scopeScreenArtwork, scopeLegendsArtwork } = await import(new URL('OscilloscopeArtwork.mjs', temp).href)

// GLTFExporter uses FileReader for Blob serialization. No DOM or fake canvas is
// needed: geometry exports first; actual encoded PNGs are embedded afterwards.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((result) => { this.result = result; this.onloadend?.() }) }
  readAsDataURL(blob) { blob.arrayBuffer().then((result) => { this.result = `data:${blob.type};base64,${Buffer.from(result).toString('base64')}`; this.onloadend?.() }) }
}
const root = new Group(); root.name = 'net_circuit_oscilloscope_2ch'
root.userData = { model: 'net*CIRCUIT two-channel oscilloscope', size: OSCILLOSCOPE_SIZE, origin: 'center-bottom', up: 'Y', front: '+Z', unit: 'editor-world-unit', visualOnly: true }
addOscilloscopeModel(root); root.updateMatrixWorld(true)
const gltf = await new GLTFExporter().parseAsync(root, { binary: false, onlyVisible: true })
const geometry = Buffer.from(gltf.buffers[0].uri.split(',')[1], 'base64')
gltf.buffers[0].uri = 'oscilloscope-2ch.bin'
const favicon = await readFile(new URL('src/assets/icons/favicon.svg', web), 'utf8')
const embeddedLogo = favicon.match(/href="data:image\/(?:webp|png);base64,([^"]+)"/)?.[1]
if (!embeddedLogo) throw new Error('favicon.svg must contain its supplied owl artwork')
const images = [
  { material: 'scope_screen', filename: 'screen.png', png: await sharp(Buffer.from(scopeArtworkSvg(scopeScreenArtwork()))).png().toBuffer() },
  { material: 'scope_legends', filename: 'legends.png', png: await sharp(Buffer.from(scopeArtworkSvg(scopeLegendsArtwork()))).png().toBuffer() },
  { material: 'scope_brand', filename: 'owl.png', png: await sharp(Buffer.from(embeddedLogo, 'base64')).png().toBuffer() },
]
gltf.images = images.map((image) => ({ uri: image.filename }))
gltf.samplers = [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }]
gltf.textures = images.map((_, i) => ({ sampler: 0, source: i }))
images.forEach((image, i) => {
  const material = gltf.materials.find((material) => material.name === image.material)
  if (!material) throw new Error(`Missing texture slot: ${image.material}`)
  material.pbrMetallicRoughness.baseColorFactor = [1, 1, 1, 1]
  material.pbrMetallicRoughness.baseColorTexture = { index: i }
  if (image.material !== 'scope_screen') material.alphaMode = 'BLEND'
})
// Preserve the front-facing UV orientation: glTF textures have flipY=false.
// Three's exporter normally flips CanvasTexture image rows. Here the source maps
// are supplied afterwards: invert V instead, once for each of our three planes.
for (const node of gltf.nodes.filter((node) => ['screen', 'front_legends', 'brand_owl'].includes(node.name))) {
  const accessor = gltf.accessors[gltf.meshes[node.mesh].primitives[0].attributes.TEXCOORD_0]
  const view = gltf.bufferViews[accessor.bufferView]
  const offset = view.byteOffset + (accessor.byteOffset ?? 0)
  for (let i = 0; i < accessor.count; i++) {
    const y = offset + i * (view.byteStride ?? 8) + 4
    geometry.writeFloatLE(1 - geometry.readFloatLE(y), y)
  }
}
const align = (bytes, fill = 0) => Buffer.concat([bytes, Buffer.alloc((4 - bytes.length % 4) % 4, fill)])
const packed = structuredClone(gltf); delete packed.buffers[0].uri
const chunks = [align(geometry)]
let length = chunks[0].length
packed.images = images.map((image) => {
  const bufferView = packed.bufferViews.length
  packed.bufferViews.push({ buffer: 0, byteOffset: length, byteLength: image.png.length })
  const chunk = align(image.png); chunks.push(chunk); length += chunk.length
  return { bufferView, mimeType: 'image/png' }
})
packed.buffers[0].byteLength = length
const json = align(Buffer.from(JSON.stringify(packed)), 0x20), bin = Buffer.concat(chunks)
const header = Buffer.alloc(12), jsonHeader = Buffer.alloc(8), binHeader = Buffer.alloc(8)
header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + json.length + bin.length, 8)
jsonHeader.writeUInt32LE(json.length, 0); jsonHeader.writeUInt32LE(0x4e4f534a, 4)
binHeader.writeUInt32LE(bin.length, 0); binHeader.writeUInt32LE(0x004e4942, 4)
const glb = Buffer.concat([header, jsonHeader, json, binHeader, bin])
const output = new URL('public/models/oscilloscope-2ch/', web)
await mkdir(output, { recursive: true })
await writeFile(new URL('oscilloscope-2ch.gltf', output), JSON.stringify(gltf, null, 2) + '\n')
await writeFile(new URL('oscilloscope-2ch.bin', output), geometry)
await writeFile(new URL('oscilloscope-2ch.glb', output), glb)
for (const image of images) await writeFile(new URL(image.filename, output), image.png)

// A compact SVG palette preview shares the screen/legend artwork with the model.
const px = (x) => (x / 6 + 0.5) * 1536, py = (y) => (1 - y / 3.8) * 960
const artworkBody = (artwork) => scopeArtworkSvg(artwork).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')
const knobLayout = [[1.35, 3.10, .23], [2.02, 3.10, .135], [1.35, 2.24, .165], [1.43, 1.35, .215], [1.43, .77, .12], [2.43, 1.35, .215], [2.43, .77, .12]]
const controls = knobLayout.map(([x, y, r]) => `<circle cx="${px(x)}" cy="${py(y)}" r="${r * 256}" fill="#121c24" stroke="#7894a1" stroke-width="5"/><path d="M ${px(x)} ${py(y) - r * 210} v ${r * 95}" stroke="#e2ebef" stroke-width="7"/>`).join('')
const bncs = [-1.4, -.18].map((x, i) => `<circle cx="${px(x)}" cy="${py(.45)}" r="52" fill="#c6d2d9" stroke="${i ? '#20d4ee' : '#ffe04a'}" stroke-width="10"/><circle cx="${px(x)}" cy="${py(.45)}" r="22" fill="#111c24"/>`).join('')
const buttonRects = [[2.60, 3.36, '#20d4ee'], [2.60, 3.10, '#36d790'], [2.60, 2.84, '#35434e'], [2.17, 2.32, '#35434e'], [2.66, 2.32, '#35434e'], [2.42, 2.08, '#35434e']].map(([x, y, color]) => `<rect x="${px(x) - 60}" y="${py(y) - 24}" width="120" height="48" rx="9" fill="${color}"/>`).join('')
const preview = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160" viewBox="-30 -20 1596 1050"><rect x="110" y="930" width="150" height="65" rx="12" fill="#111b23"/><rect x="1270" y="930" width="150" height="65" rx="12" fill="#111b23"/><rect width="1536" height="960" rx="38" fill="#343e47" stroke="#617580" stroke-width="12"/><rect x="26" y="78" width="948" height="710" rx="20" fill="#090f14"/><rect x="1020" y="82" width="482" height="782" rx="18" fill="#25313a"/><g transform="translate(80 108) scale(.8625 .8898)">${artworkBody(scopeScreenArtwork())}</g>${controls}${buttonRects}${bncs}<image x="68" y="16" width="60" height="60" href="data:image/png;base64,${images[2].png.toString('base64')}"/>${artworkBody(scopeLegendsArtwork())}</svg>`
await writeFile(new URL('src/assets/icons/oscilloscope_2ch.svg', web), preview + '\n')
let triangles = 0, meshes = 0
root.traverse((node) => { if (node instanceof Mesh) { meshes++; triangles += (node.geometry.index?.count ?? node.geometry.attributes.position.count) / 3 } })
console.log(JSON.stringify({ output: fileURLToPath(output), triangles, meshes, glbBytes: glb.length, knobs: OSCILLOSCOPE_KNOBS.length, channelInputs: 2 }))
