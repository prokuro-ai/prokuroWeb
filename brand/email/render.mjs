/**
 * Renders the email-signature mark and writes copy-paste HTML.
 *
 *   node brand/email/render.mjs
 *
 * Edit PERSON below, re-run, then open signature.html and copy the block.
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)))
const WEB = join(ROOT, '../..')
const PUBLIC = join(WEB, 'public/brand/email')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const PERSON = {
  name: 'Yusuf Morsi',
  title: 'Founder',
  company: 'Prokuro',
  email: 'sales@prokuro.ai',
  phone: '',
  web: 'https://prokuro.ai',
  webLabel: 'prokuro.ai',
  linkedin: 'https://www.linkedin.com/company/prokuro/',
  location: 'San Francisco, CA',
  tagline: 'Your AI procurement analyst for BOM risk',
}

const NAVY = '#0f1b2d'
const MUTED = '#4f5d73'
const SUBTLE = '#7a8598'
const LINE = '#dde4ee'
const ACCENT = '#2b4fff'

function markSvg(size, color) {
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

function htmlMark(size) {
  const mark = Math.round(size * 0.78)
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html, body { margin: 0; width: ${size}px; height: ${size}px; background: #ffffff; overflow: hidden; }
  .wrap { width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; }
</style></head>
<body><div class="wrap">${markSvg(mark, NAVY)}</div></body></html>`
}

function shot(html, filename, w, h) {
  const htmlPath = join(ROOT, `_${filename}.html`)
  const outPath = join(ROOT, filename)
  writeFileSync(htmlPath, html)
  execFileSync(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--force-device-scale-factor=1',
      `--window-size=${w},${h}`,
      '--virtual-time-budget=2000',
      `--screenshot=${outPath}`,
      `file://${htmlPath}`,
    ],
    { stdio: 'inherit' },
  )
  unlinkSync(htmlPath)
  return outPath
}

function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function link(href, label, color = ACCENT) {
  return `<a href="${esc(href)}" style="color:${color};text-decoration:none;">${esc(label)}</a>`
}

/**
 * Outlook-safe signature. Tables + inline CSS only.
 * imgSrc is the path/URL used in the <img>.
 */
function signatureTable({ imgSrc, variant = 'personal' }) {
  const phone = PERSON.phone
    ? `<span style="color:${LINE};">&nbsp;&nbsp;·&nbsp;&nbsp;</span>${link(`tel:${PERSON.phone.replace(/\s/g, '')}`, PERSON.phone, NAVY)}`
    : ''

  const identity =
    variant === 'sales'
      ? `
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:22px;color:${NAVY};">
          ${esc(PERSON.company)}
        </div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${MUTED};padding-top:2px;">
          ${esc(PERSON.tagline)}
        </div>`
      : `
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:22px;color:${NAVY};">
          ${esc(PERSON.name)}
        </div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${MUTED};padding-top:2px;">
          ${esc(PERSON.title)}&nbsp;&nbsp;·&nbsp;&nbsp;${esc(PERSON.company)}
        </div>`

  return `
<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;">
  <tr>
    <td valign="middle" style="padding:0 16px 0 0;">
      <a href="${esc(PERSON.web)}" style="text-decoration:none;">
        <img src="${esc(imgSrc)}" width="48" height="48" alt="Prokuro" style="display:block;border:0;outline:none;width:48px;height:48px;">
      </a>
    </td>
    <td valign="middle" style="padding:0 0 0 16px;border-left:1px solid ${LINE};">
      ${identity}
      <div style="height:10px;line-height:10px;font-size:10px;">&nbsp;</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;color:${NAVY};">
        ${link(`mailto:${PERSON.email}`, PERSON.email, NAVY)}${phone}
      </div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;color:${NAVY};">
        ${link(PERSON.web, PERSON.webLabel, ACCENT)}
        <span style="color:${LINE};">&nbsp;&nbsp;·&nbsp;&nbsp;</span>
        ${link(PERSON.linkedin, 'LinkedIn', ACCENT)}
        <span style="color:${LINE};">&nbsp;&nbsp;·&nbsp;&nbsp;</span>
        <span style="color:${SUBTLE};">${esc(PERSON.location)}</span>
      </div>
    </td>
  </tr>
</table>`.trim()
}

function previewPage({ personal, sales }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Prokuro email signature</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f5f7fa;
      color: ${NAVY};
      font-family: Arial, Helvetica, sans-serif;
    }
    .page { max-width: 760px; margin: 0 auto; padding: 48px 24px 80px; }
    h1 { font-family: Georgia, 'Times New Roman', serif; font-weight: 400; font-size: 32px; letter-spacing: -0.02em; margin: 0 0 8px; }
    .lede { color: ${MUTED}; font-size: 15px; line-height: 1.55; margin: 0 0 36px; max-width: 42em; }
    h2 { font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: ${SUBTLE}; font-weight: 600; margin: 36px 0 12px; }
    ol { margin: 0 0 28px; padding-left: 20px; color: ${MUTED}; font-size: 14px; line-height: 1.65; }
    .card {
      background: #fff;
      border: 1px solid ${LINE};
      padding: 28px 32px;
    }
    .mail {
      background: #fff;
      border: 1px solid ${LINE};
      padding: 0;
    }
    .mail-meta {
      padding: 16px 24px;
      border-bottom: 1px solid ${LINE};
      font-size: 13px;
      color: ${MUTED};
      line-height: 1.7;
    }
    .mail-meta strong { color: ${NAVY}; font-weight: 600; }
    .mail-body { padding: 24px; font-size: 14px; line-height: 1.65; color: ${NAVY}; }
    .mail-body p { margin: 0 0 14px; }
    .sig { padding: 8px 24px 28px; }
    .copy-target {
      display: inline-block;
      padding: 14px 16px;
      border: 1px dashed ${LINE};
      background: #fff;
    }
    .hint { font-size: 12px; color: ${SUBTLE}; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="page">
    <h1>Prokuro email signature</h1>
    <p class="lede">
      Same mark as the site, sized for Gmail, Apple Mail, and Outlook.
      Select the dashed box (logo through the links), copy, then paste into your client.
    </p>

    <h2>Gmail</h2>
    <ol>
      <li>Select everything inside the dashed area below, including the logo.</li>
      <li>Copy.</li>
      <li>Gmail → Settings → See all settings → General → Signature → Create new → paste.</li>
      <li>Set it as the default for new emails (and replies if you want).</li>
    </ol>

    <h2>Apple Mail</h2>
    <ol>
      <li>Mail → Settings → Signatures → add a signature → paste the same block.</li>
    </ol>

    <h2>Outlook</h2>
    <ol>
      <li>Settings → Accounts → Signatures → paste. If the logo is missing, insert <code>prokuro-mark.png</code> from this folder and set it to 48×48.</li>
    </ol>

    <h2>Personal — copy this</h2>
    <div class="mail">
      <div class="mail-meta">
        <div><strong>From</strong> ${esc(PERSON.name)} &lt;${esc(PERSON.email)}&gt;</div>
        <div><strong>Subject</strong> Following up</div>
      </div>
      <div class="mail-body">
        <p>Hi,</p>
        <p>Thanks for taking the time today. I’ll send the next steps shortly.</p>
        <p>Best,</p>
      </div>
      <div class="sig" id="sig-personal">
        <div class="copy-target">
        ${personal}
        </div>
      </div>
    </div>
    <p class="hint">Edit the name, title, and email in <code>brand/email/render.mjs</code> (PERSON) and re-run <code>node brand/email/render.mjs</code>.</p>

    <h2>Sales inbox — copy this</h2>
    <div class="card" id="sig-sales">
      <div class="copy-target">
      ${sales}
      </div>
    </div>
  </div>
</body>
</html>`
}

mkdirSync(ROOT, { recursive: true })
mkdirSync(PUBLIC, { recursive: true })

console.log('rendering mark')
shot(htmlMark(96), 'prokuro-mark.png', 96, 96)

copyFileSync(join(ROOT, 'prokuro-mark.png'), join(PUBLIC, 'prokuro-mark.png'))

const personal = signatureTable({ imgSrc: 'prokuro-mark.png', variant: 'personal' })
const sales = signatureTable({ imgSrc: 'prokuro-mark.png', variant: 'sales' })
const personalHosted = signatureTable({
  imgSrc: 'https://prokuro.ai/brand/email/prokuro-mark.png',
  variant: 'personal',
})
const salesHosted = signatureTable({
  imgSrc: 'https://prokuro.ai/brand/email/prokuro-mark.png',
  variant: 'sales',
})

writeFileSync(join(ROOT, 'signature.html'), previewPage({ personal, sales }))
writeFileSync(join(ROOT, 'signature-personal.html'), personal)
writeFileSync(join(ROOT, 'signature-sales.html'), sales)
writeFileSync(join(ROOT, 'signature-personal-hosted.html'), personalHosted)
writeFileSync(join(ROOT, 'signature-sales-hosted.html'), salesHosted)

const closeup = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html, body { margin: 0; background: #ffffff; }
  body { padding: 40px 48px; }
</style></head>
<body>${personal}</body></html>`
shot(closeup, 'preview-signature.png', 720, 200)

console.log('done')
console.log('open', join(ROOT, 'signature.html'))
