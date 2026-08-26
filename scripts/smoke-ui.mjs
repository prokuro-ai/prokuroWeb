#!/usr/bin/env node
/**
 * Live UI/UX smoke: HTTP + Playwright clicks on marketing + gated routes.
 * Usage: node scripts/smoke-ui.mjs [baseUrl...]
 */
import { chromium } from 'playwright'

const bases = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['https://app.prokuro.ai', 'https://prokuro.ai']

const results = []
function ok(base, name, detail = '') {
  results.push({ base, name, pass: true, detail })
  console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ''}`)
}
function fail(base, name, detail = '') {
  results.push({ base, name, pass: false, detail })
  console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
}

async function httpChecks(base) {
  console.log(`\n== HTTP ${base} ==`)
  const expect200 = ['/', '/pricing', '/schedule', '/privacy', '/terms']
  for (const path of expect200) {
    const res = await fetch(`${base}${path}`, { redirect: 'follow' })
    if (res.ok) ok(base, `GET ${path}`, `${res.status}`)
    else fail(base, `GET ${path}`, `${res.status}`)
  }

  // Gated routes should redirect to /schedule (Amplify SSR). Pages static may 404 app routes.
  const gated = [
    '/login',
    '/signup',
    '/dashboard',
    '/purchasing',
    '/account',
    '/boms',
    '/analyze',
    '/bom/new',
  ]
  for (const path of gated) {
    const res = await fetch(`${base}${path}`, { redirect: 'manual' })
    const loc = res.headers.get('location') || ''
    if (res.status >= 300 && res.status < 400 && loc.includes('/schedule')) {
      ok(base, `gate ${path}`, `${res.status} → ${loc}`)
    } else if (res.status === 404) {
      // GitHub Pages static export has no app routes
      ok(base, `gate ${path}`, `404 (static/Pages — expected if not Amplify)`)
    } else {
      fail(base, `gate ${path}`, `${res.status} loc=${loc}`)
    }
  }

  // /invite is listed as blocked in access.ts but missing from middleware matcher
  const invite = await fetch(`${base}/invite/accept`, { redirect: 'manual' })
  const inviteLoc = invite.headers.get('location') || ''
  if (invite.status >= 300 && invite.status < 400 && inviteLoc.includes('/schedule')) {
    ok(base, 'gate /invite/accept', `${invite.status} → ${inviteLoc}`)
  } else {
    fail(
      base,
      'gate /invite/accept',
      `${invite.status} loc=${inviteLoc || '(none)'} — likely missing from middleware matcher`,
    )
  }
}

async function browserChecks(base) {
  console.log(`\n== Browser ${base} ==`)
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const consoleErrors = []
  page.on('pageerror', (e) => consoleErrors.push(e.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  try {
    await page.goto(base + '/', { waitUntil: 'networkidle', timeout: 45000 })
    const title = await page.title()
    if (title.toLowerCase().includes('prokuro')) ok(base, 'home title', title)
    else fail(base, 'home title', title)

    // Nav: no Login / Try Prokuro when self-serve off
    const loginVisible = await page.locator('a', { hasText: /^Login$/i }).count()
    const tryVisible = await page.locator('a', { hasText: /Try Prokuro/i }).count()
    if (loginVisible === 0 && tryVisible === 0) ok(base, 'no Login/Try Prokuro in nav')
    else fail(base, 'no Login/Try Prokuro in nav', `login=${loginVisible} try=${tryVisible}`)

    const bookDemo = page.locator('a', { hasText: /Book a demo/i }).first()
    if (await bookDemo.count()) {
      await bookDemo.click()
      await page.waitForURL(/\/schedule/, { timeout: 15000 })
      ok(base, 'Book a demo → /schedule')
    } else {
      fail(base, 'Book a demo → /schedule', 'CTA not found')
    }

    // Schedule page interactive shell
    await page.goto(base + '/schedule', { waitUntil: 'networkidle', timeout: 45000 })
    const scheduleH = await page.locator('h1, h2').first().textContent().catch(() => '')
    ok(base, 'schedule loads', (scheduleH || '').trim().slice(0, 80))

    // Pricing
    await page.goto(base + '/pricing', { waitUntil: 'networkidle', timeout: 45000 })
    const signIn = await page.locator('a', { hasText: /^Sign in$/i }).count()
    if (signIn === 0) ok(base, 'pricing has no Sign in')
    else fail(base, 'pricing has no Sign in', `count=${signIn}`)

    // Click first plan CTA on home pricing section
    await page.goto(base + '/#pricing', { waitUntil: 'networkidle', timeout: 45000 })
    const planCta = page.locator('#pricing a.btn').first()
    if (await planCta.count()) {
      const href = await planCta.getAttribute('href')
      await planCta.click()
      await page.waitForTimeout(1500)
      const url = page.url()
      if (url.includes('/schedule') || href === '/schedule' || href?.includes('schedule')) {
        ok(base, 'pricing card CTA → schedule', `href=${href} url=${url}`)
      } else if (url.includes('/pricing') && href === '/pricing') {
        // self-serve would go pricing; with gate should be schedule
        fail(base, 'pricing card CTA → schedule', `still self-serve path href=${href}`)
      } else {
        fail(base, 'pricing card CTA → schedule', `href=${href} url=${url}`)
      }
    } else {
      fail(base, 'pricing card CTA', 'no #pricing a.btn')
    }

    // Footer legal
    await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 45000 })
    for (const [label, path] of [
      ['Privacy', '/privacy'],
      ['Terms', '/terms'],
    ]) {
      const link = page.locator(`a[href="${path}"], a[href$="${path}"]`).first()
      if (await link.count()) {
        await link.click()
        await page.waitForURL(new RegExp(path), { timeout: 15000 })
        ok(base, `footer ${label}`)
        await page.goto(base + '/', { waitUntil: 'domcontentloaded' })
      } else {
        fail(base, `footer ${label}`, 'link missing')
      }
    }

    // Mobile nav
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(base + '/', { waitUntil: 'networkidle', timeout: 45000 })
    const menuBtn = page.locator('button[aria-label*="menu" i], button[aria-label*="Menu" i], button.nav-toggle, button:has-text("Menu")').first()
    if (await menuBtn.count()) {
      await menuBtn.click()
      await page.waitForTimeout(400)
      ok(base, 'mobile menu opens')
    } else {
      // may always show links
      ok(base, 'mobile menu', 'no toggle (links may be always visible)')
    }

    if (consoleErrors.length) {
      fail(base, 'no page console errors', consoleErrors.slice(0, 5).join(' | '))
    } else {
      ok(base, 'no page console errors')
    }
  } catch (e) {
    fail(base, 'browser suite', String(e))
  } finally {
    await browser.close()
  }
}

for (const base of bases) {
  await httpChecks(base.replace(/\/$/, ''))
}
for (const base of bases) {
  await browserChecks(base.replace(/\/$/, ''))
}

const failed = results.filter((r) => !r.pass)
console.log(`\n==== SUMMARY ${results.length - failed.length}/${results.length} passed ====`)
if (failed.length) {
  console.log('Failures:')
  for (const f of failed) console.log(`  [${f.base}] ${f.name}: ${f.detail}`)
  process.exit(1)
}
