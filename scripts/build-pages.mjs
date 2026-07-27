/**
 * Static GitHub Pages build.
 * Temporarily excludes server-only / product routes (Next cannot export them),
 * then restores so Amplify/SSR `npm run build` keeps working.
 *
 * See docs/GITHUB-PAGES.md for revert steps.
 *
 * Uses copy+remove instead of rename (Windows/OneDrive often blocks rename).
 */
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const stashRoot = path.join(root, '.pages-stash')

/** Paths removed only for the static Pages build (restored afterward). */
const MOVES = [
  { from: path.join(root, 'app', 'api'), to: path.join(stashRoot, 'api') },
  { from: path.join(root, 'middleware.ts'), to: path.join(stashRoot, 'middleware.ts') },
  { from: path.join(root, 'app', 'dashboard'), to: path.join(stashRoot, 'dashboard') },
  { from: path.join(root, 'app', 'login'), to: path.join(stashRoot, 'login') },
  { from: path.join(root, 'app', 'signup'), to: path.join(stashRoot, 'signup') },
  { from: path.join(root, 'app', 'account'), to: path.join(stashRoot, 'account') },
  { from: path.join(root, 'app', 'analyze'), to: path.join(stashRoot, 'analyze') },
  { from: path.join(root, 'app', 'bom'), to: path.join(stashRoot, 'bom') },
  { from: path.join(root, 'app', 'auth'), to: path.join(stashRoot, 'auth') },
]

function moveAway(from, to) {
  if (!existsSync(from)) return
  cpSync(from, to, { recursive: true })
  rmSync(from, { recursive: true, force: true })
}

function moveBack(from, to) {
  if (!existsSync(to)) return
  if (existsSync(from)) rmSync(from, { recursive: true, force: true })
  cpSync(to, from, { recursive: true })
  rmSync(to, { recursive: true, force: true })
}

function stash() {
  rmSync(stashRoot, { recursive: true, force: true })
  mkdirSync(stashRoot, { recursive: true })
  for (const { from, to } of MOVES) {
    moveAway(from, to)
  }
}

function restore() {
  for (const { from, to } of MOVES) {
    moveBack(from, to)
  }
  rmSync(stashRoot, { recursive: true, force: true })
}

function build() {
  const env = {
    ...process.env,
    STATIC_EXPORT: '1',
    NEXT_PUBLIC_STATIC_EXPORT: '1',
  }
  const result = spawnSync('npx', ['next', 'build'], {
    cwd: root,
    env,
    stdio: 'inherit',
    shell: true,
  })
  if (result.status !== 0) {
    throw new Error(`next build failed with status ${result.status}`)
  }
}

function finalizeOut() {
  const outDir = path.join(root, 'out')
  const indexHtml = path.join(outDir, 'index.html')
  const notFoundPage = path.join(outDir, '404', 'index.html')
  const notFoundRoot = path.join(outDir, '404.html')
  if (!existsSync(indexHtml)) {
    throw new Error('Static export missing out/index.html')
  }
  // GitHub Pages serves 404.html for unknown paths; use the real not-found page.
  const fallback404 = existsSync(notFoundPage) ? notFoundPage : indexHtml
  cpSync(fallback404, notFoundRoot)
  writeFileSync(path.join(outDir, '.nojekyll'), '')
  writeFileSync(
    path.join(outDir, '.pages-build.json'),
    JSON.stringify({ staticExport: true, builtAt: new Date().toISOString() }, null, 2),
  )
}

try {
  console.log('[build-pages] Stashing server/product routes …')
  stash()
  console.log('[build-pages] Building with STATIC_EXPORT=1 …')
  build()
  finalizeOut()
  console.log('[build-pages] Wrote out/ (and out/404.html)')
} catch (error) {
  console.error('[build-pages] Failed:', error)
  process.exitCode = 1
} finally {
  console.log('[build-pages] Restoring stashed paths …')
  restore()
}
