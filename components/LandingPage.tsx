'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Globe2, ShieldCheck, Landmark, ArrowRight, Check } from 'lucide-react'
import { MarketingAuthActions } from '@/components/UserMenu'
import ProkuroBrandLink from '@/components/ProkuroBrandLink'
import { BOOK_DEMO_LABEL, SCHEDULE_DEMO_PATH } from '@/lib/sales'
import { PRIVACY_PATH, TERMS_PATH } from '@/lib/legal'

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

const HOW_IT_WORKS = [
  {
    title: 'Upload your BOM',
    copy: 'CSV or Excel in any column format: messy headers, distributor SKUs, multi-sheet workbooks. Prokuro maps your columns on the first upload and remembers the mapping.',
    specs: [
      { label: 'Accepts', values: ['.csv, .xlsx, multi-sheet workbooks'] },
      { label: 'Mapped', values: ['Mfg P/N → mpn', 'QTY/ASSY → quantity', 'Mfr → manufacturer'] },
    ],
  },
  {
    title: 'Your analyst works the data layer',
    copy: 'Every line is resolved against lifecycle status, distributor stock, factory lead time, tariff exposure, and your own AML alternates before anything gets scored.',
    specs: [
      { label: 'Checked', values: ['Lifecycle, stock, lead time', 'Tariff, origin, your AML'] },
      { label: 'Normalized', values: ['R10K0402 = RES-10K = 10 kΩ 0402'] },
    ],
  },
  {
    title: 'Get a decision, not a data dump',
    copy: 'Every at-risk line comes back as a decision card: why it is risky, the recommended alternate, a confidence score, and what to do about it this week.',
    specs: [
      { label: 'Returns', values: ['One decision card per at-risk line', 'Alternate, confidence, next action'] },
      { label: 'Share', values: ['Export to XLSX or PDF'] },
    ],
  },
]

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

type LogoEntry =
  | { kind: 'logo'; src: string; alt: string }
  | {
      kind: 'acquisition'
      primary: { src: string; alt: string }
      acquirer: { src: string; alt: string }
    }

const LOGOS: LogoEntry[] = [
  { kind: 'logo', src: '/images/logos/Google_2015_logo.svg.png', alt: 'Google' },
  { kind: 'logo', src: '/images/logos/Amazon_logo.svg.png', alt: 'Amazon' },
  { kind: 'logo', src: '/images/logos/fico-logo-coreblue-large.png', alt: 'FICO' },
  {
    kind: 'acquisition',
    primary: { src: '/images/logos/Brex_Inc._Corporate_Logo.png', alt: 'Brex' },
    acquirer: { src: '/images/logos/Capital_One_logo.png', alt: 'Capital One' },
  },
  { kind: 'logo', src: '/images/logos/Southwest_Airlines_logo_2014.svg.png', alt: 'Southwest Airlines' },
  { kind: 'logo', src: '/images/logos/ServiceNow-Logo.png', alt: 'ServiceNow' },
  { kind: 'logo', src: '/images/logos/Cisco_logo_blue_2016.svg.png', alt: 'Cisco' },
]

type RiskTone = 'ok' | 'warn' | 'bad'

type ReportRow = {
  line: string
  mpn: string
  maker: string
  lifecycle: string
  lifecycleTone: RiskTone
  stock: string
  lead: string
  leadRising?: boolean
  tariff: string
  risk: number
  flagged?: boolean
}

const REPORT_ROWS: ReportRow[] = [
  {
    line: '0042',
    mpn: 'TPS62840DLCR',
    maker: 'Texas Instruments',
    lifecycle: 'Active',
    lifecycleTone: 'ok',
    stock: '128,400',
    lead: '8 wk',
    tariff: '—',
    risk: 1.8,
  },
  {
    line: '0118',
    mpn: 'STM32F407VGT6',
    maker: 'STMicroelectronics',
    lifecycle: 'NRND',
    lifecycleTone: 'warn',
    stock: '6,200',
    lead: '22 wk',
    leadRising: true,
    tariff: '7.5%',
    risk: 7.6,
  },
  {
    line: '0203',
    mpn: 'LM2903DR',
    maker: 'Texas Instruments',
    lifecycle: 'Active',
    lifecycleTone: 'ok',
    stock: '891,000',
    lead: '6 wk',
    tariff: '—',
    risk: 1.2,
  },
  {
    line: '0267',
    mpn: 'B57861S0103F040',
    maker: 'TDK',
    lifecycle: 'EOL',
    lifecycleTone: 'bad',
    stock: '2,150',
    lead: '26 wk',
    leadRising: true,
    tariff: '25%',
    risk: 9.1,
    flagged: true,
  },
  {
    line: '0310',
    mpn: 'GRM188R71H104KA93D',
    maker: 'Murata',
    lifecycle: 'Active',
    lifecycleTone: 'ok',
    stock: '4,120,000',
    lead: '4 wk',
    tariff: '7.5%',
    risk: 3.4,
  },
]

const DELIVERABLES = [
  {
    title: 'Lifecycle status',
    body: 'Active, NRND, EOL, or discontinued on every line, with the reason it matters for your build date rather than a bare status badge.',
  },
  {
    title: 'Stock and lead time',
    body: 'Aggregate distributor inventory and factory lead time per line, flagged the moment coverage falls short of your production run.',
  },
  {
    title: 'Lead time trend',
    body: 'Whether a 12-week lead is quietly heading toward 26, so the change reaches you before it reaches your build schedule.',
  },
  {
    title: 'Risk score, 1 to 10',
    body: 'Weighted from lifecycle stage, stock depth, approved alternates, and tariff exposure. Every score shows the inputs behind it.',
  },
  {
    title: 'AML parsed and checked',
    body: 'Alternates buried in comma-separated cells, separate sheets, or multi-sheet workbooks get linked to primaries and revalidated.',
  },
  {
    title: 'Tariff exposure',
    body: 'Country of origin, Section 301 rate, and added cost at your volume per line, rolled up into one BOM-level number.',
  },
]

function riskTone(score: number): RiskTone {
  if (score >= 7) return 'bad'
  if (score >= 4) return 'warn'
  return 'ok'
}

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
                  <a className="btn btn--primary" href="/signup">
                    Get started free
                    <ArrowRight size={14} aria-hidden="true" />
                  </a>
                  <a className="btn btn--outline" href={SCHEDULE_DEMO_PATH}>
                    Book a demo
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="built-by" aria-label="Built by">
          <div className="container">
            <div className="built-by__inner">
              <p className="built-by__lead">Built by engineers previously at</p>
              <div className="built-by__logos">
                {LOGOS.map((entry) =>
                  entry.kind === 'acquisition' ? (
                    <div
                      key={`${entry.primary.alt}-${entry.acquirer.alt}`}
                      className="built-by__logo-group"
                      aria-label={`${entry.primary.alt}, acquired by ${entry.acquirer.alt}`}
                    >
                      <div className="built-by__logo-pair">
                        <img
                          src={entry.primary.src}
                          alt={entry.primary.alt}
                          width={104}
                          height={22}
                          className="built-by__logo"
                          loading="lazy"
                        />
                        <img
                          src={entry.acquirer.src}
                          alt={entry.acquirer.alt}
                          width={104}
                          height={22}
                          className="built-by__logo"
                          loading="lazy"
                        />
                      </div>
                      <span className="built-by__logo-caption">acquired by</span>
                    </div>
                  ) : (
                    <img
                      key={entry.alt}
                      src={entry.src}
                      alt={entry.alt}
                      width={104}
                      height={22}
                      className="built-by__logo"
                      loading="lazy"
                    />
                  ),
                )}
              </div>
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
            <Reveal className="hiw__head">
              <p className="eyebrow">How it works</p>
              <h2>From a messy spreadsheet to a decision, in one pass.</h2>
              <p className="section-lead">
                Three steps and no integration project. Upload the BOM you already have and get back the analysis your
                team would otherwise spend a week assembling by hand.
              </p>
            </Reveal>

            <ol className="hiw__steps">
              {HOW_IT_WORKS.map((step, i) => (
                <li className="hiw__step" key={step.title}>
                  <Reveal delay={i * 0.08}>
                    <span className="hiw__num">Step {String(i + 1).padStart(2, '0')}</span>
                    <h3 className="hiw__title">{step.title}</h3>
                    <p className="hiw__copy">{step.copy}</p>
                    <dl className="hiw__spec">
                      {step.specs.map((spec) => (
                        <div className="hiw__spec-row" key={spec.label}>
                          <dt>{spec.label}</dt>
                          <dd>
                            {spec.values.map((value) => (
                              <span key={value}>{value}</span>
                            ))}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section section--deliver">
          <div className="container">
            <Reveal className="deliver__head">
              <p className="eyebrow">What your analyst delivers</p>
              <h2>Decisions grounded in data, explained in plain language.</h2>
              <p className="section-lead">
                Not another component database. Prokuro combines public component data, your BOM context, and reasoning across procurement constraints, so every recommendation is sourced, scored, and actionable.
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <figure className="report">
                <div className="report__bar">
                  <span>BOM-2417 · Rev C · 1,284 lines</span>
                  <span className="report__stat">
                    <span className="report__dot report__dot--bad" aria-hidden="true" />
                    18% of spend flagged
                  </span>
                </div>

                <div className="report__scroll">
                  <table className="report__table">
                    <caption className="sr-only">Example risk report for a 1,284-line bill of materials</caption>
                    <thead>
                      <tr>
                        <th scope="col">Line</th>
                        <th scope="col">Manufacturer part</th>
                        <th scope="col">Lifecycle</th>
                        <th scope="col" className="report__num">Stock</th>
                        <th scope="col" className="report__num">Lead</th>
                        <th scope="col" className="report__num">Tariff</th>
                        <th scope="col">Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {REPORT_ROWS.map((row) => {
                        const tone = riskTone(row.risk)
                        return (
                          <tr key={row.line} className={row.flagged ? 'report__row--flagged' : undefined}>
                            <td className="report__line">{row.line}</td>
                            <td>
                              <span className="report__mpn">{row.mpn}</span>
                              <span className="report__maker">{row.maker}</span>
                            </td>
                            <td>
                              <span className="report__life">
                                <span className={`report__dot report__dot--${row.lifecycleTone}`} aria-hidden="true" />
                                {row.lifecycle}
                              </span>
                            </td>
                            <td className="report__num report__mono">{row.stock}</td>
                            <td className="report__num report__mono">
                              {row.lead}
                              {row.leadRising ? (
                                <span className="report__rising" title="Trending up">
                                  ↑
                                </span>
                              ) : null}
                            </td>
                            <td className="report__num report__mono">{row.tariff}</td>
                            <td>
                              <span className={`report__risk report__risk--${tone}`}>
                                <span className="report__risk-track" aria-hidden="true">
                                  <span className="report__risk-fill" style={{ width: `${row.risk * 10}%` }} />
                                </span>
                                <span className="report__risk-num">{row.risk.toFixed(1)}</span>
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <figcaption className="report__why">
                  <p className="report__why-label">Line 0267 — why 9.1</p>
                  <p className="report__why-body">
                    TDK discontinued this thermistor in March. 2,150 units remain across Digi-Key and Mouser against
                    your 8,000-unit run, and your AML lists no approved alternate for it.
                  </p>
                  <p className="report__why-body">
                    Nearest drop-in is <b>NCP18XH103F03RB</b> from Murata: same 10 kΩ ±1% in 0603, but the B-constant
                    differs by 40 K, so firmware calibration needs an engineering sign-off before you switch.
                  </p>
                  <ul className="report__actions">
                    <li>
                      <span>Recommended</span> Qualify the alternate before week 42
                    </li>
                    <li>
                      <span>Cost impact</span> +$1,840 in tariffs at 8,000 units
                    </li>
                  </ul>
                </figcaption>
              </figure>
            </Reveal>

            <Reveal delay={0.12}>
              <ol className="deliver__index">
                {DELIVERABLES.map((item, i) => (
                  <li key={item.title} className="deliver__item">
                    <span className="deliver__num">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="deliver__title">{item.title}</h3>
                    <p className="deliver__body">{item.body}</p>
                  </li>
                ))}
              </ol>
            </Reveal>
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
                  <p className="eyebrow">Enterprise</p>
                  <h2>Need a guided rollout for your procurement team?</h2>
                  <p>
                    For mid-size OEMs rolling out across a team, we run scoped pilots on a real BOM — white-glove onboarding, dedicated support, and annual contracts. Same analyst as self-serve, built for how your organization sources.
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
              <p>
                Sign up free and upload your first BOM, or book a demo for a guided pilot with your procurement team.
              </p>
              <div className="cta-banner__actions">
                <a className="btn btn--primary" href="/signup">
                  Get started free
                  <ArrowRight size={14} aria-hidden="true" />
                </a>
                <a className="btn btn--ghost" href={SCHEDULE_DEMO_PATH}>
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
                <li>
                  <a href={PRIVACY_PATH}>Privacy</a>
                </li>
                <li>
                  <a href={TERMS_PATH}>Terms</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer__bottom">
            <p className="footer__legal">© 2026 Prokuro.ai. All rights reserved.</p>
            <div className="footer-actions">
              <a className="footer-action-link" href={PRIVACY_PATH}>
                Privacy
              </a>
              <a className="footer-action-link" href={TERMS_PATH}>
                Terms
              </a>
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
