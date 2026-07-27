'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Globe2,
  ShieldCheck,
  Landmark,
  Activity,
  Layers,
  FileSpreadsheet,
  Globe,
  Clock,
  ArrowRight,
  Check,
} from 'lucide-react'
import { MarketingAuthActions } from '@/components/UserMenu'
import ProkuroBrandLink from '@/components/ProkuroBrandLink'
import { BOOK_DEMO_LABEL, SCHEDULE_DEMO_PATH } from '@/lib/sales'

const NAV_LINKS = [
  { href: '#product', label: 'Product' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '/schedule', label: 'Book a demo' },
  { href: '#company', label: 'Company' },
] as const

function NavLinks({
  className,
  onNavigate,
}: {
  className?: string
  onNavigate?: () => void
}) {
  return (
    <nav className={className} aria-label="Primary">
      {NAV_LINKS.map((link) => (
        <a key={link.href} href={link.href} onClick={onNavigate}>
          {link.label}
        </a>
      ))}
    </nav>
  )
}

function UploadBomIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <path
        d="M8 3.5H18.5L23 8V25.5C23 26.3284 22.3284 27 21.5 27H8C7.17157 27 6.5 26.3284 6.5 25.5V5C6.5 4.17157 7.17157 3.5 8 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        opacity="0.9"
      />
      <path d="M18.5 3.5V8H23" stroke="currentColor" strokeWidth="1.6" fill="none" opacity="0.9" />
      <path d="M10 14H19M10 18H16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
      <circle cx="21.5" cy="21.5" r="6.5" fill="#0062ff" />
      <path
        d="M21.5 24.5V18.5M18.7 21.3L21.5 18.5L24.3 21.3"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

function SourcingNetworkIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <path d="M15 15L6 8M15 15L24 8M15 15L6 23M15 15L24 23" stroke="currentColor" strokeWidth="1.4" opacity="0.35" />
      <circle cx="15" cy="15" r="4" fill="#0062ff" />
      <circle cx="6" cy="8" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.9" />
      <circle cx="24" cy="8" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.9" />
      <circle cx="6" cy="23" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.9" />
      <circle cx="24" cy="23" r="2.5" fill="#0062ff" stroke="#0062ff" strokeWidth="1.4" />
    </svg>
  )
}

function RiskPlanIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <rect x="4" y="6" width="16" height="20" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.9" />
      <path d="M8 12H16M8 16H13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
      <circle cx="21.5" cy="20.5" r="6.5" fill="#0062ff" />
      <path
        d="M18.7 20.5L20.6 22.4L24.3 18"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

const PROBLEM_STATS = [
  { value: '7+', label: 'Systems per BOM on average — ERP, PLM, spreadsheets, email, distributor portals', source: 'Industry estimate' },
  { value: '15–25%', label: 'Higher total BOM cost from poor sourcing data and part mismatches', source: 'AGS Devices' },
  { value: '$4T', label: 'Lost globally in a single high-volatility year to supply chain disruption', source: 'McKinsey & Company' },
  { value: '3–5 days', label: 'Typical cross-functional scramble when a single part goes NRND', source: 'Procurement teams' },
]

const PILOT_BENEFITS = [
  'Guided onboarding with your procurement team on a real BOM',
  'Decision-ready risk analysis — not another dashboard to babysit',
  'Alternates cross-checked against lifecycle, stock, tariff exposure, and your AML',
  'Direct input into how the analyst fits your sourcing workflow',
]

const PROBLEM_POINTS = [
  {
    title: 'Fragmented data, no source of truth',
    body: 'A single product spans OEMs, CMs, distributors, and suppliers — each with their own ERP, PLM, spreadsheets, and part numbers. Procurement teams stitch it together by hand.',
  },
  {
    title: 'Unstructured engineering artifacts',
    body: 'BOMs, datasheets, ECOs, supplier quotes, and compliance certificates live in PDFs and email threads. Humans spend hours reading documents that software should parse.',
  },
  {
    title: 'Decisions require cross-functional coordination',
    body: 'When a part goes NRND, procurement, engineering, and quality each run their own checks. The alternate isn\'t the hard part — eliminating the 3-day Slack thread is.',
  },
]

const LOGOS = [
  { src: '/images/logos/Google_2015_logo.svg.png', alt: 'Google' },
  { src: '/images/logos/Amazon_logo.svg.png', alt: 'Amazon' },
  { src: '/images/logos/fico-logo-coreblue-large.png', alt: 'FICO' },
  { src: '/images/logos/Brex_Inc._Corporate_Logo.png', alt: 'Brex' },
  { src: '/images/logos/Southwest_Airlines_logo_2014.svg.png', alt: 'Southwest Airlines' },
  { src: '/images/logos/ServiceNow-Logo.png', alt: 'ServiceNow' },
  { src: '/images/logos/Cisco_logo_blue_2016.svg.png', alt: 'Cisco' },
]

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const shouldReduceMotion = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

function FeatureCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-xl ${className ?? ''}`}>{children}</div>
}

export default function LandingPage() {
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

      <main>
        <section className="hero">
          <motion.div
            className="hero__glow"
            aria-hidden="true"
            animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.06, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="container">
            <div className="hero__centered">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
                <p className="eyebrow">Your AI procurement analyst for BOM risk</p>
                <h1>Which parts in your BOM are about to become a problem — and what to order instead.</h1>
                <p className="hero__subheadline">
                  Prokuro reads your BOM, cross-references lifecycle, availability, and tariff exposure — then hands you a decision, not a dashboard. Every at-risk line gets a recommended alternate, confidence score, and what to do this week.
                </p>
                <div className="hero__cta">
                  <a className="btn btn--primary" href={SCHEDULE_DEMO_PATH}>
                    Book a demo
                  </a>
                  <a className="btn btn--ghost" href="#how-it-works">
                    How it works
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="built-by" aria-label="Built by">
          <div className="container">
            <p className="built-by__lead">Built by engineers who worked at:</p>
            <div className="built-by__logos">
              {LOGOS.map((logo) => (
                <img
                  key={logo.alt}
                  src={logo.src}
                  alt={logo.alt}
                  width={120}
                  height={28}
                  className="built-by__logo"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </section>

        <section id="product" className="section problem-section">
          <div className="container">
            <Reveal>
              <p className="eyebrow">Why procurement still runs on spreadsheets</p>
            </Reveal>
            <Reveal>
              <h2>The supply chain is fragmented. Decisions shouldn&apos;t be.</h2>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="section-lead">
                Teams pay for component databases but still manage BOM risk in email and spreadsheets — not because the data is bad, but because those tools don&apos;t fit how people actually make decisions. Prokuro is software that participates in those decisions: grounded in real component data, explained in plain language, and ready for your team to act on.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <div className="problem-stats">
              <div className="container problem-stats__grid">
                {PROBLEM_STATS.map((stat) => (
                  <div key={stat.value} className="problem-stat">
                    <div className="problem-stat__value">{stat.value}</div>
                    <p className="problem-stat__label">{stat.label}</p>
                    <span className="problem-stat__source">{stat.source}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <div className="container">
            <div className="three-col problem-points">
              {PROBLEM_POINTS.map((point, i) => (
                <Reveal key={point.title} delay={0.1 * i}>
                  <article className="problem-point">
                    <h3>{point.title}</h3>
                    <p>{point.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="section section--surface">
          <div className="container">
            <h2>How it works</h2>
            <div className="steps-flow">
              <div className="steps-flow-grid">
                {[
                  {
                    Icon: UploadBomIcon,
                    title: 'Upload your BOM',
                    copy: 'CSV or Excel, any column format — messy headers, distributor SKUs, multi-sheet workbooks. Prokuro normalizes part identities, maps columns on first upload, and remembers your mapping forever.',
                  },
                  {
                    Icon: SourcingNetworkIcon,
                    title: 'Your analyst works the data layer',
                    copy: 'Each line is resolved against lifecycle status, distributor stock, factory lead time, tariff exposure, and your own AML alternates. Component identities are normalized so R10K0402 and RES-10K resolve to the same part.',
                  },
                  {
                    Icon: RiskPlanIcon,
                    title: 'Get a decision, not a data dump',
                    copy: 'Decision cards for every at-risk line: why it\'s risky, the recommended alternate, confidence score, availability, and what to do this week. Export the report or share it with engineering and quality.',
                  },
                ].map(({ Icon, title, copy }, i) => (
                  <div className="step-flow-item" key={title}>
                    <div className="step-flow-head">
                      <div className="step-flow-icon">
                        <Icon size={28} />
                      </div>
                      <span className="step-flow-num">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section" style={{ background: '#f7faff' }}>
          <div className="container">
            <div style={{ maxWidth: '48rem', marginBottom: '3rem' }}>
              <p
                className="eyebrow"
                style={{ color: '#0062ff', fontSize: 16, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}
              >
                What your analyst delivers
              </p>
              <h2>Decisions grounded in data — explained in plain language.</h2>
              <p style={{ color: '#4f5d73', fontSize: 18, lineHeight: 1.6, marginTop: 12 }}>
                Not another component database. Prokuro combines public component data, your BOM context, and reasoning across procurement constraints — so every recommendation is sourced, scored, and actionable.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="flex flex-col gap-8">
                <FeatureCard className="border border-[#d6deea] bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                        <Activity className="h-6 w-6 text-[#0062ff]" />
                      </div>
                      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, lineHeight: 1.3, color: '#0f1b2d' }}>
                        Lifecycle status with plain-language reasoning
                      </h3>
                    </div>
                    <p className="text-[#4f5d73] leading-relaxed" style={{ margin: '0 0 20px' }}>
                      Every part categorized as Active, NRND, EOL, or Discontinued — with an explanation of why it matters for your production timeline, not just a status badge.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-700 border-green-200">
                        Active
                      </span>
                      <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border-amber-200">
                        NRND
                      </span>
                      <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-700 border-red-200">
                        EOL
                      </span>
                    </div>
                  </div>
                </FeatureCard>

                <FeatureCard className="border-transparent bg-gradient-to-br from-[#0062ff] to-[#004bcc] shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                  <div className="p-8 sm:p-10 relative z-10">
                    <div className="flex items-center gap-4 mb-7">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                        <Layers className="h-6 w-6 text-white" />
                      </div>
                      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, lineHeight: 1.3, color: '#fff' }}>
                        Stock and lead time at major distributors
                      </h3>
                    </div>
                    <p style={{ color: '#cfe0ff', fontSize: 17, lineHeight: 1.6, margin: '0 0 28px' }}>
                      Real-time stock and factory lead time per line. Flagged when aggregate inventory falls below your production run — before you&apos;re waiting 26 weeks for a regulator.
                    </p>
                    <div
                      className="flex items-center justify-between mb-6"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.15)', borderBottom: '1px solid rgba(255,255,255,0.15)', padding: '16px 0' }}
                    >
                      <span style={{ color: '#cfe0ff', fontSize: 14, fontWeight: 500 }}>Global stock across distributors</span>
                      <span style={{ color: '#fff', fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>14.2M</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)', padding: 16 }}>
                        <p style={{ color: '#cfe0ff', fontSize: 12, margin: '0 0 6px' }}>Digi-Key</p>
                        <p style={{ color: '#fff', fontSize: 15, fontWeight: 600, margin: 0 }}>In stock</p>
                      </div>
                      <div className="rounded-lg" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)', padding: 16 }}>
                        <p style={{ color: '#cfe0ff', fontSize: 12, margin: '0 0 6px' }}>Mouser</p>
                        <p style={{ color: '#fcd34d', fontSize: 15, fontWeight: 600, margin: 0 }}>Low stock</p>
                      </div>
                    </div>
                  </div>
                </FeatureCard>

                <FeatureCard className="border border-[#d6deea] bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                        <FileSpreadsheet className="h-6 w-6 text-[#0062ff]" />
                      </div>
                      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, lineHeight: 1.3, color: '#0f1b2d' }}>
                        Your AML, parsed and cross-checked
                      </h3>
                    </div>
                    <p className="text-[#4f5d73] leading-relaxed">
                      Alternates in comma-separated cells, separate AML sheets, or multi-sheet workbooks — parsed, linked to primaries, and validated against current lifecycle and availability.
                    </p>
                  </div>
                </FeatureCard>
              </div>

              <div className="flex flex-col gap-8 md:mt-24">
                <FeatureCard className="border-transparent bg-gradient-to-bl from-[#0051d4] to-[#0f1b2d] shadow-xl overflow-hidden relative">
                  <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
                  <div className="p-8 sm:p-10 relative z-10">
                    <div className="flex items-center gap-4 mb-7">
                      <div
                        className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-4 border-red-500"
                        style={{ background: 'rgba(255,255,255,0.1)' }}
                      >
                        <span style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>8.4</span>
                      </div>
                      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, lineHeight: 1.3, color: '#fff' }}>
                        Risk scores your analyst explains
                      </h3>
                    </div>
                    <p style={{ color: '#cfe0ff', fontSize: 17, lineHeight: 1.6, margin: '0 0 28px' }}>
                      1–10 risk score per line with plain-language reasoning — lifecycle stage, stock depth, approved alternates, and tariff exposure. Every score shows its work.
                    </p>
                    <div className="flex flex-col gap-3">
                      <div
                        className="flex items-center gap-3 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: 14 }}
                      >
                        <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
                        <span style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>Single source demand concentration</span>
                      </div>
                      <div
                        className="flex items-center gap-3 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: 14 }}
                      >
                        <TrendingDown className="h-5 w-5 shrink-0 text-amber-400" />
                        <span style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>Inventory depleting faster than avg</span>
                      </div>
                    </div>
                  </div>
                </FeatureCard>

                <FeatureCard className="border border-[#d6deea] bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                        <Clock className="h-6 w-6 text-[#0062ff]" />
                      </div>
                      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, lineHeight: 1.3, color: '#0f1b2d' }}>
                        Lead time trends
                      </h3>
                    </div>
                    <p className="text-[#4f5d73] leading-relaxed" style={{ margin: '0 0 20px' }}>
                      Factory lead time and whether it&apos;s trending up or down — so you know a 12-week lead isn&apos;t about to become 26 weeks before your build date.
                    </p>
                    <div className="flex items-center gap-3 text-sm font-medium">
                      <span className="text-red-600">26 weeks</span>
                      <ArrowRight className="h-4 w-4 text-[#d6deea]" />
                      <span className="text-amber-600 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1" /> Trending up
                      </span>
                    </div>
                  </div>
                </FeatureCard>

                <FeatureCard className="border border-[#d6deea] bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                        <Globe className="h-6 w-6 text-[#0062ff]" />
                      </div>
                      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, lineHeight: 1.3, color: '#0f1b2d' }}>
                        Tariff &amp; geopolitical exposure
                      </h3>
                    </div>
                    <p className="text-[#4f5d73] leading-relaxed">
                      Country of origin, Section 301 tariff rate, and estimated added cost at your production volume — per line, rolled up into one BOM-level number.
                    </p>
                  </div>
                </FeatureCard>
              </div>
            </div>
          </div>
        </section>

        <section className="section section--tariff">
          <div className="container">
            <div className="split-panel">
              <Reveal>
                <div className="split-panel__copy">
                  <p className="eyebrow">Tariff &amp; geopolitical risk</p>
                  <h2>Trade exposure rolled into every decision — not a separate spreadsheet.</h2>
                  <p>
                    Every line checked comes back with country of origin, applicable Section 301 tariff rate, and estimated cost impact at your production volume. Prokuro rolls it up into one number your procurement team can act on — before it shows up in a cost overrun.
                  </p>
                  <ul className="split-panel__stats">
                    <li>
                      <Globe2 size={18} aria-hidden="true" />
                      <span>Country of origin resolved per line, not per brand</span>
                    </li>
                    <li>
                      <Landmark size={18} aria-hidden="true" />
                      <span>Section 301 rate and Entity List status flagged automatically</span>
                    </li>
                    <li>
                      <ShieldCheck size={18} aria-hidden="true" />
                      <span>One summary number: added cost at your production volume</span>
                    </li>
                  </ul>
                </div>
              </Reveal>
              <Reveal delay={0.15}>
                <div className="exposure-card">
                  <div className="exposure-card__header">
                    <span>BOM trade exposure</span>
                    <span className="risk-pill risk-pill--high">18% at risk</span>
                  </div>
                  <p className="exposure-card__line">18% of your BOM by line count has China-origin exposure.</p>
                  <div className="exposure-card__row">
                    <span>Estimated added cost at production volume</span>
                    <strong>$41,200</strong>
                  </div>
                  <div className="exposure-card__row exposure-card__row--muted">
                    <span>Entity List flags</span>
                    <strong>2 lines</strong>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="section section--surface">
          <div className="container">
            <h2>Built for hardware teams paying the coordination tax on every sourcing decision.</h2>
            <p className="section-lead">
              Every sourcing decision crosses procurement, engineering, and quality — but the data lives in BOMs, emails, datasheets, and supplier quotes nobody shares. Prokuro starts with your BOM and eliminates the days of coordination that follow.
            </p>
            <div className="two-col">
              <article className="card">
                <h3>Best fit</h3>
                <ul className="list">
                  <li>Procurement and supply chain managers at hardware OEMs (10–500 employees)</li>
                  <li>Products with 3–10 year lifespans: networking, industrial, medical-adjacent</li>
                  <li>Teams where a single NRND notice triggers a multi-day cross-functional scramble</li>
                  <li>Companies with approved alternates, preferred suppliers, and audit history trapped in spreadsheets</li>
                  <li>Procurement leads who own outcomes but depend on engineering and quality to approve every swap</li>
                </ul>
              </article>
              <article className="card">
                <h3>Not a fit if…</h3>
                <ul className="list">
                  <li>You&apos;re building consumer hardware with 1-year product cycles</li>
                  <li>You have a 20-person supply chain team and internal ML capabilities</li>
                  <li>You don&apos;t have a production BOM yet — Prokuro starts where your sourcing data already lives</li>
                  <li>You need a procurement platform, ERP, or compliance tool — Prokuro is an intelligence layer, not a transaction system</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="quote-card">
              <p className="quote">
                &ldquo;Alternate #4 is technically compatible, already in your AML, stocked at Digi-Key, avoids the new tariff, and requires no firmware changes. Here&apos;s what you need to do this week.&rdquo;
              </p>
              <p>
                That&apos;s what a personalized procurement analyst delivers — not a list of 12 parametric matches you still have to validate yourself. The value isn&apos;t the alternate. It&apos;s eliminating the cross-functional coordination that usually takes days.
              </p>
            </div>
          </div>
        </section>

        <section id="contact" className="section section--surface">
          <div className="container">
            <div className="split-panel">
              <Reveal>
                <div className="split-panel__copy">
                  <p className="eyebrow">Design partners</p>
                  <h2>We onboard procurement teams selectively.</h2>
                  <p>
                    Prokuro is not self-serve yet. We work with hardware procurement teams through guided pilots — upload a real BOM, get a decision-ready risk report, and help shape the analyst around how your team actually sources.
                  </p>
                  <ul className="split-panel__stats">
                    {PILOT_BENEFITS.map((benefit) => (
                      <li key={benefit}>
                        <Check size={18} aria-hidden="true" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <a className="btn btn--primary" href={SCHEDULE_DEMO_PATH} style={{ marginTop: 'var(--space-lg)' }}>
                    Book a demo
                    <ArrowRight size={14} aria-hidden="true" />
                  </a>
                </div>
              </Reveal>
              <Reveal delay={0.15}>
                <div className="early-access-card">
                  <p className="early-access-card__eyebrow">What you&apos;ll get</p>
                  <h3 className="early-access-card__title">A decision report, not another tool to babysit.</h3>
                  <p className="early-access-card__body">
                    Upload a BOM and get decision cards for every at-risk line — lifecycle reasoning, recommended alternates, tariff impact, and what to do this week. Export and share with engineering and quality.
                  </p>
                  <div className="early-access-card__metric">
                    <span>Typical first scan</span>
                    <strong>Under 5 min</strong>
                  </div>
                  <div className="early-access-card__metric early-access-card__metric--muted">
                    <span>Built for</span>
                    <strong>Procurement &amp; supply chain</strong>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="section cta-banner">
          <div className="container cta-banner__inner">
            <Reveal>
              <h2>From BOM upload to decision — in minutes, not days.</h2>
              <p>Talk to our team about a pilot. We&apos;ll walk through your BOM workflow and scope a first scan together.</p>
              <div className="cta-banner__actions">
                <a className="btn btn--primary" href={SCHEDULE_DEMO_PATH}>
                  Book a demo
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer id="company" className="footer">
        <div className="container footer__inner">
          <div className="footer__top">
            <div className="footer__brand">
              <a className="brand" href="#top">
                <span className="brand__dot" aria-hidden="true" />
                <span>Prokuro.ai</span>
              </a>
              <p className="footer__meta">Your AI procurement analyst for hardware supply chains.</p>
              <p className="footer__meta">San Francisco, CA</p>
            </div>
            <div>
              <h3 className="footer__col-title">Product</h3>
              <ul className="footer__links">
                <li>
                  <a href="#product">Overview</a>
                </li>
                <li>
                  <a href="#how-it-works">How it works</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="footer__col-title">Company</h3>
              <ul className="footer__links">
                <li>
                  <a href="#company">About</a>
                </li>
                <li>
                  <a href={SCHEDULE_DEMO_PATH}>Book a demo</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer__bottom">
            <p className="footer__legal">© 2026 Prokuro.ai. All rights reserved.</p>
            <div className="footer-actions">
              <a className="footer-action-link" href="https://www.linkedin.com/company/prokuro/" target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
              <a className="footer-action-link" href={SCHEDULE_DEMO_PATH}>
                {BOOK_DEMO_LABEL}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
