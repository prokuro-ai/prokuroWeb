/**
 * Copy static export (out/) into docs/ for GitHub Pages branch deploy.
 * docs/ is served as the site root when Pages source is main → /docs.
 */
import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'out')
const docsDir = path.join(root, 'docs')

if (!existsSync(path.join(outDir, 'index.html'))) {
  console.error('[sync-pages] Missing out/index.html — run npm run build:pages first')
  process.exit(1)
}

for (const entry of readdirSync(docsDir)) {
  rmSync(path.join(docsDir, entry), { recursive: true, force: true })
}

cpSync(outDir, docsDir, { recursive: true })
console.log('[sync-pages] Copied out/ → docs/ (ready to commit and push)')
