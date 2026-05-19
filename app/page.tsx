'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

const LOGOS = [
  { src: '/images/logos/Google_2015_logo.svg.png', alt: 'Google logo' },
  { src: '/images/logos/Amazon_logo.svg.png', alt: 'Amazon logo' },
  { src: '/images/logos/fico-logo-coreblue-large.png', alt: 'FICO logo' },
  { src: '/images/logos/Southwest_Airlines_logo_2014.svg.png', alt: 'Southwest Airlines logo' },
  { src: '/images/logos/ServiceNow-Logo.png', alt: 'ServiceNow logo' },
  { src: '/images/logos/CarsXE.png', alt: 'CarsXE logo' },
  { src: '/images/logos/Cisco_logo_blue_2016.svg.png', alt: 'Cisco logo', className: 'logo-chip--cisco' },
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
    <>
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
            <a className="btn btn--ghost" href="#waitlist" onClick={openWaitlistModal}>
              Join Waitlist
            </a>
            <Link className="btn btn--primary" href="/analyze">
              Analyze a BOM
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero__grid">
            <div>
              <p className="eyebrow">Component intelligence for hardware OEMs</p>
              <h1>Upload a BOM and get lifecycle, stock, and lead-time visibility in minutes.</h1>
              <p className="hero__subheadline">
                Prokuro.ai parses messy CSV/XLSX BOMs into clean part rows, then enriches each line with Nexar part matching, availability, lifecycle status, and factory lead-time signals. Built for hardware teams that need fast, reliable BOM intelligence.
              </p>
              <div className="hero__cta">
                <a className="btn btn--primary" href="#waitlist" onClick={openWaitlistModal}>
                  Get Access
                </a>
                <a className="btn btn--ghost" href="#pricing">
                  See Pricing
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="logo-showcase" aria-label="Operational credibility logos">
          <div className="container">
            <p className="logo-showcase__lead">Built by engineers who solved similar problems at:</p>
          </div>
          <div className="logo-belt">
            <div className="logo-belt__track">
              {[0, 1, 2].map((group) => (
                <div className="logo-belt__group" aria-hidden={group > 0} key={group}>
                  {LOGOS.map((logo) => (
                    <span className={`logo-chip ${logo.className ?? ''}`.trim()} key={`${group}-${logo.src}`}>
                      <Image src={logo.src} alt={group === 0 ? logo.alt : ''} width={156} height={36} loading="lazy" />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="product" className="section">
          <div className="container">
            <h2>What Prokuro.ai solves</h2>
            <div className="three-col">
              <article className="card">
                <div className="icon" aria-hidden="true" />
                <h3>Messy BOM exports slow teams down</h3>
                <p>Real BOM files are inconsistent across ERP, PLM, and EMS exports. We map headers, normalize rows, and produce a clean canonical structure quickly.</p>
              </article>
              <article className="card">
                <div className="icon" aria-hidden="true" />
                <h3>Part visibility is fragmented</h3>
                <p>Procurement teams often check stock, lifecycle, and lead time in multiple tools. We return those signals line-by-line in one consistent output.</p>
              </article>
              <article className="card">
                <div className="icon" aria-hidden="true" />
                <h3>You need a fast first-pass analysis</h3>
                <p>Before deeper sourcing work, teams need a reliable first pass on what matched, what did not, and where availability or lifecycle looks concerning.</p>
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
                <p>CSV or Excel. We extract every MPN, manufacturer, and quantity. Takes 60 seconds.</p>
              </article>
              <article className="card">
                <div className="step-number">2</div>
                <h3>We enrich every line item</h3>
                <p>Using Nexar part data, we return match status, lifecycle, stock availability, lead-time hints, and top seller inventory per matched component.</p>
              </article>
              <article className="card">
                <div className="step-number">3</div>
                <h3>Get a structured analysis result</h3>
                <p>Receive an exportable result with parse stats, warnings, enriched lines, and summary counts for in-stock, out-of-stock, no-match, and lifecycle states.</p>
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
                <p>Each matched part is categorized as active, NRND, EOL, discontinued, or unknown so teams can focus quickly on end-of-life exposure.</p>
              </article>
              <article className="card">
                <h3>Availability and stock signal</h3>
                <p>We return total available inventory and top seller snapshots from Nexar-backed data for faster triage across the BOM.</p>
              </article>
              <article className="card">
                <h3>Lead-time snapshot</h3>
                <p>Factory lead-time hints are surfaced where available, helping teams quickly identify lines that may need earlier planning attention.</p>
              </article>
              <article className="card">
                <h3>Parse warnings and match status</h3>
                <p>See low-confidence mappings, missing MPNs, distributor-SKU suspects, and exact/fuzzy/no-match outcomes in a single analysis payload.</p>
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
                  <li>Hardware OEMs with $50M-$500M in revenue</li>
                  <li>Products with 3-10 year lifespans (networking, industrial, medical-adjacent)</li>
                  <li>Teams outsourcing manufacturing to contract manufacturers</li>
                  <li>Companies that got caught in the 2021-2022 chip shortage</li>
                  <li>Procurement teams still running BOM risk on spreadsheets and gut instinct</li>
                </ul>
              </article>
              <article className="card">
                <h3>Not a fit if...</h3>
                <ul className="list">
                  <li>You&apos;re building consumer hardware with 1-year product cycles</li>
                  <li>You have a 20-person supply chain team and internal ML capabilities</li>
                  <li>You&apos;re pre-product and don&apos;t have a real BOM yet</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="quote-card">
              <p className="quote">&quot;Prokuro.ai gives hardware teams a fast, reliable first pass on BOM quality, part matches, lifecycle, stock, and lead-time signals.&quot;</p>
              <p>Built for procurement and engineering teams that need better visibility before shortages and lifecycle changes become expensive surprises.</p>
            </div>
          </div>
        </section>

        <section id="pricing" className="section">
          <div className="container">
            <h2>Pricing</h2>
            <div className="pricing-grid">
              <article className="card">
                <h3>Single BOM Analysis</h3>
                <p>
                  <strong>Starting at $2,000 per upload.</strong>
                </p>
                <p>Upload one BOM and receive parse quality output plus lifecycle, stock, and lead-time enrichment.</p>
                <p>Ideal for teams that need a fast one-time assessment.</p>
                <p className="section-cta">
                  <a className="btn btn--ghost" href="#waitlist" onClick={openWaitlistModal}>
                    Request Access
                  </a>
                </p>
              </article>
              <article className="card">
                <h3>Continuous Monitoring</h3>
                <p>
                  <strong>Starting at $4,000/month.</strong>
                </p>
                <p>Recurring BOM runs with updated parse quality, match status, lifecycle, availability, and lead-time snapshots.</p>
                <p>Built for teams that need ongoing visibility across changing supply conditions.</p>
                <p className="section-cta">
                  <a className="btn btn--ghost" href="#waitlist" onClick={openWaitlistModal}>
                    Start Monitoring
                  </a>
                </p>
              </article>
              <article className="card">
                <h3>Enterprise</h3>
                <p>
                  <strong>Custom pricing.</strong>
                </p>
                <p>For larger OEM teams with multi-BOM workflows, internal stakeholders, and integration requirements.</p>
                <p>Includes dedicated onboarding and implementation planning.</p>
                <p className="section-cta">
                  <a className="btn btn--ghost" href="#waitlist" onClick={openWaitlistModal}>
                    Talk to Us
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
              <p className="footer__meta">Fast BOM parsing and Nexar enrichment for hardware teams.</p>
              <p className="footer__meta">525 Market St, San Francisco, CA</p>
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
                <li>
                  <a href="#pricing">Pricing</a>
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
                  <a href="#pricing">Enterprise</a>
                </li>
                <li>
                  <a href="#waitlist" onClick={openWaitlistModal}>
                    Join waitlist
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="footer__col-title">Resources</h3>
              <ul className="footer__links">
                <li>
                  <a href="#pricing">Request a report</a>
                </li>
                <li>
                  <a href="#waitlist" onClick={openWaitlistModal}>
                    Contact
                  </a>
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
              <a className="footer-action-link" href="#waitlist" onClick={openWaitlistModal}>
                Join Waitlist
              </a>
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
    </>
  )
}
