'use client'

import { useEffect, useRef, useState } from 'react'
import { Link } from '@/lib/navigation'
import { ProkuroWordmark } from '@/components/brand/ProkuroLogo'
import { MarketingAuthActions } from '@/components/UserMenu'
import { MARKETING_NAV_LINKS } from '@/lib/marketing-content'
import { handleMarketingHashClick } from '@/lib/marketing-scroll'
import { BOOK_DEMO_LABEL, SCHEDULE_DEMO_PATH } from '@/lib/sales'
import { PRIVACY_PATH, TERMS_PATH } from '@/lib/legal'

function NavLinks({
  className,
  onNavigate,
}: {
  className?: string
  onNavigate?: () => void
}) {
  return (
    <nav className={className} aria-label="Primary">
      {MARKETING_NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="mk-nav-link"
          onClick={(event) => {
            handleMarketingHashClick(event, link.href)
            onNavigate?.()
          }}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}

export function MarketingFooter() {
  return (
    <footer data-surface="dark" className="border-t border-mk-line">
      <div className="mk-container py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex text-mk-ink">
              <ProkuroWordmark size={24} />
            </Link>
            <p className="mk-body mt-4 max-w-sm text-mk-ink-muted">
              Procurement agents for hardware supply chains.
            </p>
            <p className="mk-eyebrow mt-2">San Francisco, CA</p>
          </div>
          <div>
            <h3 className="mk-eyebrow">Product</h3>
            <ul className="mk-small mt-4 space-y-2">
              {MARKETING_NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="mk-nav-link mk-footer-link"
                    onClick={(event) => handleMarketingHashClick(event, link.href)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mk-eyebrow">Company</h3>
            <ul className="mk-small mt-4 space-y-2">
              <li>
                <Link href={SCHEDULE_DEMO_PATH} className="mk-nav-link mk-footer-link">
                  {BOOK_DEMO_LABEL}
                </Link>
              </li>
              <li>
                <Link href={PRIVACY_PATH} className="mk-nav-link mk-footer-link">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href={TERMS_PATH} className="mk-nav-link mk-footer-link">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mk-small mt-12 flex flex-col gap-3 border-t border-mk-line pt-6 text-mk-ink-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Prokuro.ai. All rights reserved.</p>
          <a
            href="https://www.linkedin.com/company/prokuro/"
            target="_blank"
            rel="noopener noreferrer"
            className="mk-nav-link mk-footer-link"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  )
}

export default function MarketingShell({
  children,
  surface = 'light',
}: {
  children: React.ReactNode
  surface?: 'light' | 'dark'
}) {
  const [open, setOpen] = useState(false)
  const [navSurface, setNavSurface] = useState<'light' | 'dark'>(surface)
  const [collapsed, setCollapsed] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    lastY.current = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const delta = y - lastY.current
      lastY.current = y
      if (open || y < 56) {
        setCollapsed(false)
        return
      }
      if (delta > 8) setCollapsed(true)
      else if (delta < -8) setCollapsed(false)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [open])

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('section[data-surface], footer[data-surface]'),
    )
    if (sections.length === 0) return

    const update = () => {
      const probe = 28
      const hit = sections.find((section) => {
        const box = section.getBoundingClientRect()
        return box.top <= probe && box.bottom > probe
      })
      const next = hit?.dataset.surface === 'dark' ? 'dark' : 'light'
      setNavSurface(next)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div className="font-mk-sans min-h-screen bg-mk-canvas text-mk-ink antialiased">
      <header
        data-surface={navSurface}
        className={`fixed inset-x-0 top-0 z-50 border-b border-mk-line/70 bg-mk-canvas/80 backdrop-blur-md transition-transform duration-300 ease-[var(--ease-mk-out)] ${
          collapsed ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="mk-container flex h-14 items-center gap-6">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">Menu</span>
            <span aria-hidden="true" className="flex w-4 flex-col gap-1">
              <span className="block h-px bg-mk-ink" />
              <span className="block h-px bg-mk-ink" />
              <span className="block h-px bg-mk-ink" />
            </span>
          </button>
          <Link href="/" className="text-mk-ink">
            <ProkuroWordmark size={22} />
          </Link>
          <NavLinks className="hidden items-center gap-6 md:flex" />
          <div className="ml-auto flex items-center gap-3">
            <MarketingAuthActions />
          </div>
        </div>
        {open ? (
          <div className="border-t border-mk-line px-5 py-4 md:hidden">
            <NavLinks className="flex flex-col gap-3" onNavigate={() => setOpen(false)} />
          </div>
        ) : null}
      </header>

      <div className="pt-14">{children}</div>
      <MarketingFooter />
    </div>
  )
}
