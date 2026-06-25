'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { MarketingAuthActions } from '@/components/UserMenu'

const LOGOS = [
  { src: '/images/logos/Google_2015_logo.svg.png', alt: 'Google' },
  { src: '/images/logos/Amazon_logo.svg.png', alt: 'Amazon' },
  { src: '/images/logos/fico-logo-coreblue-large.png', alt: 'FICO' },
  { src: '/images/logos/Southwest_Airlines_logo_2014.svg.png', alt: 'Southwest Airlines' },
  { src: '/images/logos/ServiceNow-Logo.png', alt: 'ServiceNow' },
  { src: '/images/logos/CarsXE.png', alt: 'CarsXE' },
  { src: '/images/logos/Cisco_logo_blue_2016.svg.png', alt: 'Cisco' },
]

export default function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('modal-open', isModalOpen)
    return () => document.body.classList.remove('modal-open')
  }, [isModalOpen])

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsModalOpen(false)
    }
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [])

  const openWaitlistModal = (event: React.MouseEvent) => {
    event.preventDefault()
    setIsModalOpen(true)
  }

  return (
    <div className="marketing-page">
      <header className="top-nav" id="top">
        <div className="container top-nav__inner">
          <a className="brand" href="#top">
            <span className="brand__dot" aria-hidden="true" />
            <span>Prokuro.ai</span>
          </a>
          <nav className="nav-links" aria-label="Primary">
            <a href="#product">Product</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
            <a href="#company">Company</a>
          </nav>
          <div className="nav-actions">
            <MarketingAuthActions />
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero__grid">
            <div>
              <p className="eyebrow">Supply chain intelligence for hardware OEMs</p>
              <h1>Which parts in your BOM are about to become a problem — and what to order instead.</h1>
              <p className="hero__subheadline">
                Upload any CSV or XLSX BOM. Prokuro resolves every MPN against Nexar, surfaces lifecycle status, stock depth at Digi-Key / Mouser / Arrow / Avnet, lead-time trends, and network-validated alternate suggestions — in minutes.
              </p>
              <div className="hero__cta">
                <Link className="btn btn--primary" href="/signup">
                  Get Started Free
                </Link>
                <a className="btn btn--ghost" href="#pricing">
                  See Pricing
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="built-by" aria-label="Built by">
          <div className="container">
            <p className="built-by__lead">Built by engineers who solved similar problems at:</p>
            <div className="built-by__logos">
              {LOGOS.map((logo) => (
                <Image
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

        <section id="product" className="section">
          <div className="container">
            <h2>The problem with BOM risk today</h2>
            <div className="three-col">
              <article className="card">
                <div className="icon" aria-hidden="true" />
                <h3>You find out too late</h3>
                <p>Most hardware teams discover component shortages or lifecycle changes after they have already committed to a manufacturing run. Every competitor sends alerts. Prokuro hands you the extinguisher with instructions.</p>
              </article>
              <article className="card">
                <div className="icon" aria-hidden="true" />
                <h3>BOMs are messy and inconsistent</h3>
                <p>Every EDA tool exports differently. Column names, MPN formats, and manufacturer naming vary. Manual normalization takes hours and introduces errors. Prokuro&apos;s AI column detection handles any format.</p>
              </article>
              <article className="card">
                <div className="icon" aria-hidden="true" />
                <h3>Alternates require engineering judgment</h3>
                <p>Finding parametric alternates is slow. Validating them is slower. Prokuro surfaces which alternates 47 other companies in its network have already qualified — ranked by real adoption, not catalog similarity.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="section section--surface">
          <div className="container">
            <h2>How it works</h2>
            <div className="steps">
              <article className="card">
                <div className="step-number">1</div>
                <h3>Upload your BOM</h3>
                <p>CSV or Excel, any column format. Prokuro AI-detects and maps columns on the first upload, then remembers your mapping for every future upload — no re-mapping ever again.</p>
              </article>
              <article className="card">
                <div className="step-number">2</div>
                <h3>We enrich every line</h3>
                <p>Each MPN is resolved against Nexar. Prokuro returns lifecycle status, stock depth at Digi-Key, Mouser, Arrow and Avnet, factory lead time, lead-time trend, risk score, and network-validated alternates.</p>
              </article>
              <article className="card">
                <div className="step-number">3</div>
                <h3>Get a decision-ready report</h3>
                <p>See an executive summary, per-line risk table sortable by risk score / lifecycle / lead time, and decision cards for each at-risk line with the proven alternate and what to do this week.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <h2>What you get</h2>
            <div className="feature-grid">
              <article className="card">
                <h3>Lifecycle status per line</h3>
                <p>Every resolved part is categorized as Active, NRND, EOL, or Discontinued. Predicted time-to-EOL based on inventory depletion signals — not just manufacturer announcements.</p>
              </article>
              <article className="card">
                <h3>Stock depth at 4 distributors</h3>
                <p>Real-time stock at Digi-Key, Mouser, Arrow, and Avnet per line. Flag when aggregate stock falls below your production run threshold.</p>
              </article>
              <article className="card">
                <h3>Lead time + trend direction</h3>
                <p>Current factory lead time and whether it&apos;s getting shorter or longer over 30/60/90 days. Know before you&apos;re waiting 26 weeks for a regulator.</p>
              </article>
              <article className="card">
                <h3>Risk score with clear reasoning</h3>
                <p>1–10 risk score per line, weighted by lifecycle stage, approved alternates, stock depth, and demand concentration. Every score shows its reasoning — not a black box.</p>
              </article>
              <article className="card">
                <h3>Network-validated alternates</h3>
                <p>Which alternates have 47 other companies actually used as drop-in replacements for this exact part? Parametric matches when network data is sparse — always labeled honestly.</p>
              </article>
              <article className="card">
                <h3>AML and multi-sheet support</h3>
                <p>Alternates in comma-separated cells, separate AML sheets, or multi-sheet workbooks — Prokuro parses and links them automatically.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section section--surface">
          <div className="container">
            <h2>Who it&apos;s for</h2>
            <div className="two-col">
              <article className="card">
                <h3>Best fit</h3>
                <ul className="list">
                  <li>Procurement and supply chain managers at hardware OEMs (10–500 employees)</li>
                  <li>Products with 3–10 year lifespans: networking, industrial, medical-adjacent</li>
                  <li>Teams outsourcing manufacturing to contract manufacturers</li>
                  <li>Companies that got caught in the 2021–2022 chip shortage</li>
                  <li>Procurement teams still running BOM risk on spreadsheets</li>
                </ul>
              </article>
              <article className="card">
                <h3>Not a fit if…</h3>
                <ul className="list">
                  <li>You&apos;re building consumer hardware with 1-year product cycles</li>
                  <li>You have a 20-person supply chain team and internal ML capabilities</li>
                  <li>You&apos;re pre-product and don&apos;t have a real BOM yet</li>
                  <li>You need a procurement platform, ERP, or compliance tool — Prokuro is intelligence, not transaction</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="quote-card">
              <p className="quote">&ldquo;This part has 14 weeks until EOL. 47 other companies in our network have already qualified MPN-XYZ-456 as a drop-in alternate. It&apos;s in stock at Digi-Key at $2.10/unit. Here&apos;s what you need to do this week.&rdquo;</p>
              <p>That&apos;s the Prokuro promise. Everything in the product exists to make that sentence possible, accurate, and trusted.</p>
            </div>
          </div>
        </section>

        <section id="pricing" className="section">
          <div className="container">
            <h2>Pricing</h2>
            <p className="pricing-subhead">Monthly subscription, per seat. Frequent uploads fuel better intelligence for everyone.</p>
            <div className="pricing-grid">
              <article className="card">
                <h3>Starter</h3>
                <p className="pricing-price">
                  $99<span className="pricing-period">/mo</span>
                </p>
                <p className="pricing-audience">1–2 person team, early-stage hardware company</p>
                <ul className="list">
                  <li>Up to 5 active BOMs</li>
                  <li>All core features: lifecycle, stock, lead time, alternates</li>
                  <li>AI column detection + saved mappings</li>
                  <li>In-browser report view</li>
                </ul>
                <p className="section-cta">
                  <Link className="btn btn--ghost" href="/signup">
                    Start free trial
                  </Link>
                </p>
              </article>
              <article className="card pricing-card--featured">
                <span className="pricing-badge">Most popular</span>
                <h3>Growth</h3>
                <p className="pricing-price">
                  $299<span className="pricing-period">/mo</span>
                </p>
                <p className="pricing-audience">Small procurement team, 3–10 people</p>
                <ul className="list">
                  <li>Up to 20 active BOMs</li>
                  <li>Everything in Starter</li>
                  <li>Team seats (up to 10)</li>
                  <li>BOM-level risk history</li>
                  <li>CSV export</li>
                </ul>
                <p className="section-cta">
                  <Link className="btn btn--primary" href="/signup">
                    Start free trial
                  </Link>
                </p>
              </article>
              <article className="card">
                <h3>Scale</h3>
                <p className="pricing-price">
                  $799<span className="pricing-period">/mo</span>
                </p>
                <p className="pricing-audience">Mid-size OEM, full procurement team</p>
                <ul className="list">
                  <li>Unlimited active BOMs</li>
                  <li>Everything in Growth</li>
                  <li>Unlimited seats</li>
                  <li>Portfolio-level risk view</li>
                  <li>Priority support + onboarding</li>
                </ul>
                <p className="section-cta">
                  <a className="btn btn--ghost" href="#waitlist" onClick={openWaitlistModal}>
                    Talk to us
                  </a>
                </p>
              </article>
            </div>
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
              <p className="footer__meta">Supply chain intelligence for hardware teams.</p>
              <p className="footer__meta">San Francisco, CA</p>
            </div>
            <div>
              <h3 className="footer__col-title">Product</h3>
              <ul className="footer__links">
                <li><a href="#product">Overview</a></li>
                <li><a href="#how-it-works">How it works</a></li>
                <li><a href="#pricing">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="footer__col-title">Company</h3>
              <ul className="footer__links">
                <li><a href="#company">About</a></li>
                <li><a href="#pricing">Enterprise</a></li>
                <li><a href="#waitlist" onClick={openWaitlistModal}>Join waitlist</a></li>
              </ul>
            </div>
            <div>
              <h3 className="footer__col-title">Account</h3>
              <ul className="footer__links">
                <li><Link href="/login">Sign in</Link></li>
                <li><Link href="/signup">Start free trial</Link></li>
                <li><a href="#waitlist" onClick={openWaitlistModal}>Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="footer__bottom">
            <p className="footer__legal">© 2026 Prokuro.ai. All rights reserved.</p>
            <div className="footer-actions">
              <a className="footer-action-link" href="https://www.linkedin.com/company/prokuro/" target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
              <Link className="footer-action-link" href="/signup">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <div id="waitlist" className={`modal ${isModalOpen ? 'is-open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="waitlistModalTitle" aria-hidden={!isModalOpen} onClick={(event) => event.target === event.currentTarget && setIsModalOpen(false)}>
        <div className="modal__dialog">
          <div className="modal__header">
            <h2 id="waitlistModalTitle" className="modal__title">
              Join the waitlist
            </h2>
            <button className="modal__close" type="button" aria-label="Close waitlist form" onClick={() => setIsModalOpen(false)}>
              Close
            </button>
          </div>
          <div className="modal__body">
            <iframe
              className="modal__iframe"
              src="https://airtable.com/embed/appFYDedlwc86G1TP/pag8tSElUaqsOvywV/form"
              title="Prokuro waitlist form"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
