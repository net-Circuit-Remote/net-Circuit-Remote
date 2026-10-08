import { build } from 'esbuild'
import { readdir, mkdir } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'

const files = (await readdir('tests')).filter((file) => file.endsWith('.test.ts'))
await mkdir('.test-build', { recursive: true })
await build({
  entryPoints: files.map((file) => `tests/${file}`),
  outdir: '.test-build',
  outExtension: { '.js': '.mjs' },
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  sourcemap: 'inline',
})
const result = spawnSync(process.execPath, ['--test', ...files.map((file) => `.test-build/${file.replace('.ts', '.mjs')}`)], { stdio: 'inherit' })
process.exit(result.status ?? 1)
