/**
 * Renders LinkedIn profile + cover assets from the live Prokuro mark and fonts.
 *
 *   node brand/linkedin/render.mjs
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)))
const WEB = join(ROOT, '../..')
const FONTS = join(WEB, 'app/fonts')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const b64 = (name) => readFileSync(join(FONTS, name)).toString('base64')

const FONT_CSS = `
@font-face {
  font-family: 'Geist';
  font-weight: 600;
  src: url(data:font/woff2;base64,${b64('geist-sans-latin-600-normal.woff2')}) format('woff2');
}
@font-face {
  font-family: 'Geist';
  font-weight: 500;
  src: url(data:font/woff2;base64,${b64('geist-sans-latin-500-normal.woff2')}) format('woff2');
}
@font-face {
  font-family: 'Instrument Serif';
  font-weight: 400;
  src: url(data:font/woff2;base64,${b64('instrument-serif-latin-400-normal.woff2')}) format('woff2');
}
@font-face {
  font-family: 'JetBrains Mono';
  font-weight: 500;
  src: url(data:font/woff2;base64,${b64('jetbrains-mono-latin-500-normal.woff2')}) format('woff2');
}
`

function markSvg(size, color = '#eef3fa') {
  const id = `m${Math.random().toString(36).slice(2, 8)}`
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
      <rect width="32" height="32" fill="white"/>
      <path d="M0 20.5 H13.5 L23 11 V0" stroke="black" stroke-width="4" stroke-linejoin="miter" fill="none"/>
    </mask>
    <path d="M11 3 H29 V21 L21 29 H3 V11 Z" fill="${color}" mask="url(#${id})"/>
  </svg>`
}

function traces(width, height, { faint = 0.22, accent = 0.38 } = {}) {
  const s = width / 1584
  return `
  <svg class="traces" viewBox="0 0 1584 ${height / s}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g fill="none" stroke-linejoin="miter" stroke-linecap="square">
      <path d="M0 70 H220 L310 0" stroke="#2c3a4e" stroke-width="1"/>
      <path d="M0 140 H180 L290 30 H900" stroke="#1b2534" stroke-width="1"/>
      <path d="M0 210 H340 L470 80 H1584" stroke="#6f8cff" stroke-width="1.15" opacity="${faint}"/>
      <path d="M0 268 H260 L400 128 H1584" stroke="#6f8cff" stroke-width="1.35" opacity="${accent}"/>
      <path d="M0 330 H420 L540 210 H1200" stroke="#8aa2ff" stroke-width="1.1" opacity="${faint * 0.85}"/>
      <path d="M740 396 V250 L860 130 H1584" stroke="#2c3a4e" stroke-width="1"/>
      <path d="M1100 396 V220 L1220 100 H1584" stroke="#1b2534" stroke-width="1"/>
      <path d="M0 188 H90" stroke="#6f8cff" stroke-width="1.2" opacity="${faint}"/>
    </g>
  </svg>`
}

function grain() {
  return `<div class="grain" aria-hidden="true"></div>`
}

const SHARED = `
${FONT_CSS}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
.grain {
  position: absolute; inset: 0; pointer-events: none; opacity: 0.42;
  mix-blend-mode: soft-light;
  background-size: 180px 180px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E");
}
.traces { position: absolute; inset: 0; width: 100%; height: 100%; }
`

function htmlPfp(size = 800) {
  const mark = Math.round(size * 0.54)
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
${SHARED}
html, body { width: ${size}px; height: ${size}px; overflow: hidden; background: #070b11; }
.stage {
  position: relative; width: ${size}px; height: ${size}px;
  background:
    radial-gradient(ellipse 42% 42% at 50% 48%, rgba(111,140,255,0.20) 0%, rgba(111,140,255,0.0) 70%),
    radial-gradient(ellipse 68% 68% at 50% 50%, #0d141e 0%, #070b11 76%);
}
.mark {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
}
.mark svg { display: block; }
</style></head>
<body>
  <div class="stage">
    ${grain()}
    <div class="mark">${markSvg(mark)}</div>
  </div>
</body></html>`
}

function htmlBanner() {
  // 1584×396. Lockup lives in the right-safe zone.
  // Desktop profile photo covers ~x=24–280, y=270–396 (bottom-left).
  // Company-page vertical crop keeps the middle ~268px. Keep type in y=90–300, x≥500.
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
${SHARED}
html, body { width: 1584px; height: 396px; overflow: hidden; background: #070b11; }
.stage {
  position: relative; width: 1584px; height: 396px;
  background:
    linear-gradient(92deg, rgb(7 11 17 / 55%) 0%, rgb(7 11 17 / 18%) 38%, rgb(7 11 17 / 0%) 62%),
    radial-gradient(ellipse 80% 140% at 78% 50%, #101826 0%, #070b11 70%);
}
.lockup {
  position: absolute;
  left: 548px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 28px;
}
.copy { display: flex; flex-direction: column; gap: 10px; }
.word {
  font-family: 'Instrument Serif', Georgia, serif;
  font-weight: 400;
  font-size: 92px;
  line-height: 0.92;
  letter-spacing: -0.03em;
  color: #eef3fa;
  margin: 0;
}
.meta {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-weight: 500;
  font-size: 15px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #8291a6;
  margin: 0;
}
</style></head>
<body>
  <div class="stage">
    ${traces(1584, 396)}
    ${grain()}
    <div class="lockup">
      ${markSvg(78)}
      <div class="copy">
        <p class="word">Prokuro</p>
        <p class="meta">BOM intelligence&nbsp;&nbsp;·&nbsp;&nbsp;prokuro.ai</p>
      </div>
    </div>
  </div>
</body></html>`
}

function htmlCompany() {
  // 1128×191. Logo overlays left ~200px when the page is opened.
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
${SHARED}
html, body { width: 1128px; height: 191px; overflow: hidden; background: #070b11; }
.stage {
  position: relative; width: 1128px; height: 191px;
  background:
    linear-gradient(92deg, rgb(7 11 17 / 50%) 0%, rgb(7 11 17 / 10%) 36%, rgb(7 11 17 / 0%) 58%),
    radial-gradient(ellipse 70% 160% at 76% 50%, #101826 0%, #070b11 72%);
}
.lockup {
  position: absolute;
  left: 292px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 18px;
}
.word {
  font-family: 'Instrument Serif', Georgia, serif;
  font-weight: 400;
  font-size: 58px;
  line-height: 0.92;
  letter-spacing: -0.03em;
  color: #eef3fa;
  margin: 0;
}
.meta {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-weight: 500;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #8291a6;
  margin: 8px 0 0;
}
</style></head>
<body>
  <div class="stage">
    ${traces(1128, 191, { faint: 0.2, accent: 0.32 })}
    ${grain()}
    <div class="lockup">
      ${markSvg(48)}
      <div>
        <p class="word">Prokuro</p>
        <p class="meta">BOM intelligence&nbsp;&nbsp;·&nbsp;&nbsp;prokuro.ai</p>
      </div>
    </div>
  </div>
</body></html>`
}

function htmlPreviewPersonal() {
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
${SHARED}
html, body { width: 1200px; height: 560px; overflow: hidden; background: #e9edf3; }
.page { width: 1200px; height: 560px; background: #f5f7fa; }
.banner {
  position: relative; width: 1200px; height: 300px; overflow: hidden;
  background: #070b11;
}
.banner-inner {
  position: absolute; inset: 0;
  background:
    linear-gradient(92deg, rgb(7 11 17 / 55%) 0%, rgb(7 11 17 / 18%) 38%, rgb(7 11 17 / 0%) 62%),
    radial-gradient(ellipse 80% 140% at 78% 50%, #101826 0%, #070b11 70%);
}
.lockup {
  position: absolute;
  left: 415px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 21px;
}
.word {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 70px; line-height: 0.92; letter-spacing: -0.03em; color: #eef3fa; margin: 0;
}
.meta {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-weight: 500; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
  color: #8291a6; margin: 8px 0 0;
}
.photo {
  position: absolute;
  left: 36px;
  top: 208px;
  width: 168px; height: 168px;
  border-radius: 50%;
  background:
    radial-gradient(ellipse 46% 46% at 50% 48%, rgba(111,140,255,0.16) 0%, rgba(111,140,255,0.0) 68%),
    radial-gradient(ellipse 70% 70% at 50% 50%, #0d141e 0%, #070b11 74%);
  border: 4px solid #f5f7fa;
  box-shadow: 0 8px 24px rgb(15 27 45 / 18%);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.body {
  padding: 92px 40px 0 228px;
}
.name {
  font-family: 'Geist', ui-sans-serif, sans-serif;
  font-weight: 600; font-size: 26px; letter-spacing: -0.02em; color: #0f1b2d; margin: 0;
}
.sub {
  font-family: 'Geist', ui-sans-serif, sans-serif;
  font-weight: 500; font-size: 15px; color: #4f5d73; margin: 6px 0 0;
}
.note {
  position: absolute; left: 36px; bottom: 18px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #7a8598;
}
</style></head>
<body>
  <div class="page">
    <div class="banner">
      <div class="banner-inner">
        ${traces(1200, 300)}
        ${grain()}
        <div class="lockup">
          ${markSvg(58)}
          <div>
            <p class="word">Prokuro</p>
            <p class="meta">BOM intelligence&nbsp;&nbsp;·&nbsp;&nbsp;prokuro.ai</p>
          </div>
        </div>
      </div>
    </div>
    <div class="photo">${markSvg(92)}</div>
    <div class="body">
      <p class="name">Prokuro</p>
      <p class="sub">Your AI procurement analyst for BOM risk</p>
    </div>
    <p class="note">Desktop preview · photo covers the bottom-left of the banner</p>
  </div>
</body></html>`
}

function htmlPreviewCompany() {
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
${SHARED}
html, body { width: 1128px; height: 420px; overflow: hidden; background: #e9edf3; }
.page { width: 1128px; height: 420px; background: #f5f7fa; }
.banner {
  position: relative; width: 1128px; height: 191px; overflow: hidden; background: #070b11;
}
.banner-inner {
  position: absolute; inset: 0;
  background:
    linear-gradient(92deg, rgb(7 11 17 / 50%) 0%, rgb(7 11 17 / 10%) 36%, rgb(7 11 17 / 0%) 58%),
    radial-gradient(ellipse 70% 160% at 76% 50%, #101826 0%, #070b11 72%);
}
.lockup {
  position: absolute; left: 292px; top: 50%; transform: translateY(-50%);
  display: flex; align-items: center; gap: 18px;
}
.word {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 58px; line-height: 0.92; letter-spacing: -0.03em; color: #eef3fa; margin: 0;
}
.meta {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-weight: 500; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase;
  color: #8291a6; margin: 8px 0 0;
}
.logo {
  position: absolute;
  left: 28px;
  top: 119px;
  width: 128px; height: 128px;
  border-radius: 12px;
  background:
    radial-gradient(ellipse 46% 46% at 50% 48%, rgba(111,140,255,0.16) 0%, rgba(111,140,255,0.0) 68%),
    radial-gradient(ellipse 70% 70% at 50% 50%, #0d141e 0%, #070b11 74%);
  border: 4px solid #f5f7fa;
  box-shadow: 0 8px 24px rgb(15 27 45 / 16%);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.body { padding: 72px 36px 0 176px; }
.name {
  font-family: 'Geist', ui-sans-serif, sans-serif;
  font-weight: 600; font-size: 24px; letter-spacing: -0.02em; color: #0f1b2d; margin: 0;
}
.sub {
  font-family: 'Geist', ui-sans-serif, sans-serif;
  font-weight: 500; font-size: 14px; color: #4f5d73; margin: 6px 0 0;
}
.note {
  position: absolute; left: 28px; bottom: 16px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #7a8598;
}
</style></head>
<body>
  <div class="page">
    <div class="banner">
      <div class="banner-inner">
        ${traces(1128, 191, { faint: 0.2, accent: 0.32 })}
        ${grain()}
        <div class="lockup">
          ${markSvg(48)}
          <div>
            <p class="word">Prokuro</p>
            <p class="meta">BOM intelligence&nbsp;&nbsp;·&nbsp;&nbsp;prokuro.ai</p>
          </div>
        </div>
      </div>
    </div>
    <div class="logo">${markSvg(72)}</div>
    <div class="body">
      <p class="name">Prokuro</p>
      <p class="sub">Your AI procurement analyst for BOM risk</p>
    </div>
    <p class="note">Company page preview · logo covers the left of the cover</p>
  </div>
</body></html>`
}

function shot(html, filename, w, h, scale = 2) {
  const htmlPath = join(ROOT, `_${filename}.html`)
  const outPath = join(ROOT, filename)
  writeFileSync(htmlPath, html)
  execFileSync(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    `--force-device-scale-factor=${scale}`,
    `--window-size=${w},${h}`,
    `--virtual-time-budget=4000`,
    `--screenshot=${outPath}`,
    `file://${htmlPath}`,
  ], { stdio: 'inherit' })
  unlinkSync(htmlPath)
  return outPath
}

mkdirSync(ROOT, { recursive: true })

const jobs = [
  { html: htmlPfp(800), file: 'linkedin-profile.png', w: 800, h: 800, scale: 1 },
  { html: htmlPfp(400), file: 'linkedin-profile-400.png', w: 400, h: 400, scale: 1 },
  { html: htmlBanner(), file: 'linkedin-banner-1584x396.png', w: 1584, h: 396, scale: 1 },
  { html: htmlBanner(), file: 'linkedin-banner-1584x396@2x.png', w: 1584, h: 396, scale: 2 },
  { html: htmlCompany(), file: 'linkedin-company-cover-1128x191.png', w: 1128, h: 191, scale: 1 },
  { html: htmlCompany(), file: 'linkedin-company-cover-1128x191@2x.png', w: 1128, h: 191, scale: 2 },
  { html: htmlPreviewPersonal(), file: 'preview-personal-overlay.png', w: 1200, h: 560, scale: 2 },
  { html: htmlPreviewCompany(), file: 'preview-company-overlay.png', w: 1128, h: 420, scale: 2 },
]

for (const job of jobs) {
  console.log('rendering', job.file)
  shot(job.html, job.file, job.w, job.h, job.scale)
}
console.log('done')
