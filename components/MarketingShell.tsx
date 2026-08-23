'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import ProkuroBrandLink from '@/components/ProkuroBrandLink'
import { MarketingAuthActions } from '@/components/UserMenu'
import { MARKETING_NAV_LINKS } from '@/lib/marketing-content'
import { Link } from '@/lib/navigation'
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
        <Link key={link.href} href={link.href} onClick={onNavigate}>
          {link.label}
        </Link>
      ))}
    </nav>
  )
}

function MarketingFooter() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__top">
          <div className="footer__brand">
            <Link className="brand" href="/">
              <span className="brand__dot" aria-hidden="true" />
              <span>Prokuro.ai</span>
            </Link>
            <p className="footer__meta">Your AI procurement analyst for hardware supply chains.</p>
            <p className="footer__meta">San Francisco, CA</p>
          </div>
          <div>
            <h3 className="footer__col-title">Product</h3>
            <ul className="footer__links">
              <li>
                <Link href="/#product">Overview</Link>
              </li>
              <li>
                <Link href="/#how-it-works">How it works</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="footer__col-title">Company</h3>
            <ul className="footer__links">
              <li>
                <Link href="/#company">About</Link>
              </li>
              <li>
                <Link href={SCHEDULE_DEMO_PATH}>Book a demo</Link>
              </li>
              <li>
                <Link href={PRIVACY_PATH}>Privacy</Link>
              </li>
              <li>
                <Link href={TERMS_PATH}>Terms</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <p className="footer__legal">© 2026 Prokuro.ai. All rights reserved.</p>
          <div className="footer-actions">
            <Link className="footer-action-link" href={PRIVACY_PATH}>
              Privacy
            </Link>
            <Link className="footer-action-link" href={TERMS_PATH}>
              Terms
            </Link>
            <a
              className="footer-action-link"
              href="https://www.linkedin.com/company/prokuro/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
            <Link className="footer-action-link" href={SCHEDULE_DEMO_PATH}>
              {BOOK_DEMO_LABEL}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function MarketingShell({ children }: { children: ReactNode }) {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  const closeNav = () => setIsNavOpen(false)

  const toggleNav = () => {
    setIsNavOpen((open) => {
      const next = !open
      if (next) {
        navRef.current?.classList.remove('top-nav--hidden')
      }
      return next
    })
  }

  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const currentY = window.scrollY
      const nav = navRef.current
      if (!nav) return
      if (isNavOpen) {
        nav.classList.remove('top-nav--hidden')
        lastY = currentY
        return
      }
      if (currentY <= 0) {
        nav.classList.remove('top-nav--hidden')
      } else if (currentY > lastY) {
        nav.classList.add('top-nav--hidden')
      } else {
        nav.classList.remove('top-nav--hidden')
      }
      lastY = currentY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isNavOpen])

  useEffect(() => {
    document.body.classList.toggle('nav-open', isNavOpen)
    return () => document.body.classList.remove('nav-open')
  }, [isNavOpen])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 750px)')
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsNavOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsNavOpen(false)
    }
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [])

  return (
    <div className="marketing-page">
      <header className="top-nav" id="top" ref={navRef}>
        <div className="container top-nav__inner">
          <button
            className={`nav-toggle${isNavOpen ? ' nav-toggle--open' : ''}`}
            type="button"
            aria-label={isNavOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isNavOpen}
            aria-controls="mobile-nav"
            onClick={toggleNav}
          >
            <span className="nav-toggle__bars" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
          <ProkuroBrandLink variant="marketing" />
          <NavLinks className="nav-links nav-links--desktop" onNavigate={closeNav} />
          <div className="nav-actions">
            <MarketingAuthActions />
          </div>
        </div>
        <div
          className={`nav-backdrop${isNavOpen ? ' nav-backdrop--open' : ''}`}
          aria-hidden={!isNavOpen}
          onClick={closeNav}
        />
        <div
          className={`nav-panel${isNavOpen ? ' nav-panel--open' : ''}`}
          id="mobile-nav"
          aria-hidden={!isNavOpen}
        >
          <NavLinks className="nav-panel__links" onNavigate={closeNav} />
        </div>
      </header>

      {children}

      <MarketingFooter />
    </div>
  )
}
