'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
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
import { AuthEntryLink } from '@/components/AuthEntryLink'
import ProkuroBrandLink from '@/components/ProkuroBrandLink'

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
  { value: '15–25%', label: 'Higher total BOM cost from poor sourcing data and part mismatches', source: 'AGS Devices' },
  { value: '$4T', label: 'Lost globally in a single high-volatility year to supply chain disruption', source: 'McKinsey & Company' },
  { value: '56%', label: 'Can trace materials to Tier-3/4 — despite 93% claiming full confidence', source: 'Tradeverifyd' },
  { value: '3.7 yrs', label: 'Average interval between month-long+ supply chain interruptions', source: 'Tradeverifyd' },
]

const PRICING_TIERS = [
  {
    name: 'Free',
    tagline: 'Risk Snapshot',
    price: '$0',
    period: '',
    description: 'A one-time scan to see what a real risk pass finds in your BOM.',
    cta: 'Get Started',
    href: '/signup',
    highlight: false,
    features: [
      '100 lines, one BOM',
      'One-time scan',
      '1 seat',
      'Top 5 lines: risk scores + explanations',
      'Teaser alternates (1 per line)',
      'Tariff exposure: summary % only',
    ],
  },
  {
    name: 'Starter',
    tagline: null,
    price: '$99',
    period: '/mo',
    description: 'For a single team keeping one BOM honest, monthly.',
    cta: 'Get Started',
    href: '/signup',
    highlight: false,
    features: [
      '500 monitored lines',
      'Up to 5 active BOMs',
      'Monthly refresh',
      '2 seats',
      'Full risk scores + explanations',
      'Full vetted alternates',
      'Per-line tariff/geo exposure',
      'Draft-action agent — 5/mo',
      'PDF / share-link reports',
    ],
  },
  {
    name: 'Growth',
    tagline: 'Recommended',
    price: '$449',
    period: '/mo',
    description: 'For procurement teams that need weekly signal across more lines.',
    cta: 'Get Started',
    href: '/signup',
    highlight: true,
    features: [
      '2,500 monitored lines',
      'Up to 20 active BOMs',
      'Weekly refresh',
      '5 seats',
      'Full risk scores + explanations',
      'Full vetted alternates',
      'Draft-action agent — 50/mo',
      'Dashboard alerts',
      'PDF / share-link reports',
    ],
  },
  {
    name: 'Scale',
    tagline: null,
    price: '$1,299',
    period: '/mo',
    description: 'For teams running daily deltas across the full BOM portfolio.',
    cta: 'Get Started',
    href: '/signup',
    highlight: false,
    features: [
      '10,000 monitored lines',
      'Unlimited active BOMs',
      'Daily refresh',
      '15 seats',
      'Per-line tariff exposure + rollups',
      'Unlimited draft-action agent',
      'Dashboard alerts + portfolio view',
      'PDF / share-link reports',
    ],
  },
  {
    name: 'Enterprise',
    tagline: null,
    price: 'Custom',
    period: 'pricing',
    description: 'Custom lines, SSO/SAML, PLM integrations, and a contractual alerts SLA.',
    cta: 'Contact Us',
    href: '#contact',
    highlight: false,
    features: [
      'Custom monitored lines',
      'Unlimited active BOMs',
      'Daily refresh + alerts SLA',
      'Unlimited seats, SSO/SAML',
      'Per-line exposure + custom HTS review',
      'Unlimited draft-action agent',
      'White-label reports',
      'PLM integrations, SOC 2 pkg, DPA',
    ],
  },
]

const PROBLEM_POINTS = [
  {
    title: 'Component obsolescence hits blind',
    body: 'Parts reach end-of-life years before the product does. Missing the notice forces reactive redesigns and halts active lines.',
  },
  {
    title: 'Tier blindness, single-source risk',
    body: 'Visibility usually stops at Tier-1. A sub-tier single-source shutdown triggers instant allocation freezes deep in your supply chain.',
  },
  {
    title: 'Sourcing panic invites counterfeits',
    body: 'An unoptimized BOM sends procurement scrambling into unverified secondary markets the moment shortages hit — and quality drops with it.',
  },
]

const LOGOS = [
  { src: '/images/logos/Google_2015_logo.svg.png', alt: 'Google' },
  { src: '/images/logos/Amazon_logo.svg.png', alt: 'Amazon' },
  { src: '/images/logos/fico-logo-coreblue-large.png', alt: 'FICO' },
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

function PricingCta({ tier, onContact }: { tier: (typeof PRICING_TIERS)[number]; onContact?: (event: React.MouseEvent) => void }) {
  const className = `btn ${tier.highlight ? 'btn--primary' : 'btn--ghost'} pricing-card__cta`

  if (tier.href.startsWith('/')) {
    return (
      <Link className={className} href={tier.href}>
        {tier.cta}
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    )
  }

  return (
    <a className={className} href={tier.href} onClick={onContact}>
      {tier.cta}
      <ArrowRight size={14} aria-hidden="true" />
    </a>
  )
}

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
          <ProkuroBrandLink variant="marketing" />
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
          <motion.div
            className="hero__glow"
            aria-hidden="true"
            animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.06, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="container hero__grid">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
              <p className="eyebrow">The agentic platform for BOM management</p>
              <h1>Which parts in your BOM are about to become a problem — and what to order instead.</h1>
              <p className="hero__subheadline">
                Prokuro turns your bill of materials into a plan of action: every part scored for lifecycle, availability, and tariff risk — and a vetted alternate ready for each one that needs it.
              </p>
              <div className="hero__cta">
                <AuthEntryLink className="btn btn--primary">
                  Explore the product
                </AuthEntryLink>
                <a className="btn btn--ghost" href="#waitlist" onClick={openWaitlistModal}>
                  See Demo
                </a>
              </div>
            </motion.div>
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

        <section id="product" className="section problem-section">
          <div className="container">
            <Reveal>
              <p className="eyebrow">The problem with BOM risk today</p>
            </Reveal>
            <Reveal>
              <h2>Every hardware team has felt this. Now it&apos;s a number.</h2>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="section-lead">
                Obsolescence, single-source dependency, allocation, and geopolitical volatility rarely strike alone — they compound. A missed EOL notice becomes a redesign; a stalled shipment becomes an allocation freeze; a shortage pushes buyers into the gray market. Without live data, teams don&apos;t see the chain reaction until it&apos;s already on the production floor.
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
                    copy: 'CSV or Excel, any column format. Prokuro AI-detects and maps columns on the first upload, then remembers your mapping for every future upload — no re-mapping ever again.',
                  },
                  {
                    Icon: SourcingNetworkIcon,
                    title: 'Our sourcing agent works the network',
                    copy: 'An autonomous agent matches each MPN against our live network of component data — lifecycle status, stock depth at Digi-Key, Mouser, Arrow and Avnet, factory lead time, lead-time trend, counterfeit-risk flags for gray-market sourcing, risk score, and ranked parametric alternates — no manual lookups.',
                  },
                  {
                    Icon: RiskPlanIcon,
                    title: 'Your risk agent hands you a plan',
                    copy: 'See an executive summary, per-line risk table sortable by risk score, lifecycle, lead time, and decision cards for each at-risk line with the proven alternate and what to do this week.',
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
                    {i < 2 && <span className="step-flow-sep" aria-hidden="true" />}
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
                What you get
              </p>
              <h2>Complete visibility into every line item.</h2>
              <p style={{ color: '#4f5d73', fontSize: 18, lineHeight: 1.6, marginTop: 12 }}>
                Move beyond static spreadsheets. Prokuro connects your BOM to a live network of component data, so every line stays current.
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
                        Lifecycle status per line
                      </h3>
                    </div>
                    <p className="text-[#4f5d73] leading-relaxed" style={{ margin: '0 0 20px' }}>
                      Every part in the network is categorized as Active, NRND, EOL, or Discontinued. Predicted time-to-EOL based on inventory depletion signals — not just manufacturer announcements.
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
                        Stock depth at 4 distributors
                      </h3>
                    </div>
                    <p style={{ color: '#cfe0ff', fontSize: 17, lineHeight: 1.6, margin: '0 0 28px' }}>
                      Real-time stock at Digi-Key, Mouser, Arrow, and Avnet per line. Flag when aggregate stock falls below your production run threshold.
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
                        AML and multi-sheet support
                      </h3>
                    </div>
                    <p className="text-[#4f5d73] leading-relaxed">
                      Alternates in comma-separated cells, separate AML sheets, or multi-sheet workbooks — Prokuro parses and links them automatically.
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
                        Your risk agent shows its work
                      </h3>
                    </div>
                    <p style={{ color: '#cfe0ff', fontSize: 17, lineHeight: 1.6, margin: '0 0 28px' }}>
                      1–10 risk score per line, weighted by lifecycle stage, approved alternates, stock depth, and demand concentration. The agent explains every score in plain language — not a black box.
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
                        Lead time + trend direction
                      </h3>
                    </div>
                    <p className="text-[#4f5d73] leading-relaxed" style={{ margin: '0 0 20px' }}>
                      Current factory lead time and whether it&apos;s getting shorter or longer over 30/60/90 days. Know before you&apos;re waiting 26 weeks for a regulator.
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
                      Country of origin, Section 301 tariff rate, Entity List status, and China-assembly exposure — per line, with estimated added cost at your production volume.
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
                  <h2>Know your trade exposure before it shows up in a cost overrun.</h2>
                  <p>
                    Every line checked against the network comes back with country of origin, applicable Section 301 tariff rate, US Entity List status, and a flag for China-assembly exposure — even for parts fabbed elsewhere. Prokuro rolls it up into one number: the estimated tariff cost impact across your BOM at current volume.
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
            <h2>Who it&apos;s for</h2>
            <p className="section-lead">
              BOM risk isn&apos;t a once-a-year event — it&apos;s obsolescence notices, single-source dependencies, and allocation freezes converging into a missed build, week after week. Prokuro is built for the teams who feel that pressure directly.
            </p>
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
                  <li>You need a procurement platform, ERP, or compliance tool — Prokuro is an agentic platform, not a transaction system</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="quote-card">
              <p className="quote">
                &ldquo;This part has 14 weeks until EOL. MPN-XYZ-456 is a validated parametric alternate — same footprint, same specs. It&apos;s in stock at Digi-Key at $2.10/unit. Here&apos;s what you need to do this week.&rdquo;
              </p>
              <p>
                That&apos;s what our agents deliver, not a dashboard you have to interpret yourself. Everything in the product exists to make that sentence possible, accurate, and trusted.
              </p>
            </div>
          </div>
        </section>

        <section id="pricing" className="section section--surface">
          <div className="container">
            <div className="pricing-head">
              <p className="eyebrow">Pricing</p>
              <h2>Priced on lines monitored, not seats.</h2>
              <p className="section-lead">
                The meter is your risk surface: how many BOM lines Prokuro is watching, and how often. Score explanations and full alternate data are on every paid plan — trust isn&apos;t something we gate.
              </p>
            </div>
            <div className="pricing-grid">
              {PRICING_TIERS.map((tier) => (
                <article key={tier.name} className={`pricing-card${tier.highlight ? ' pricing-card--highlight' : ''}`}>
                  <span className="pricing-card__tag" aria-hidden={tier.tagline ? undefined : true}>
                    {tier.tagline ?? '\u00A0'}
                  </span>
                  <h3 className="pricing-card__name">{tier.name}</h3>
                  <div className="pricing-card__price">
                    <span className="pricing-card__amount">{tier.price}</span>
                    {tier.period && <span className="pricing-card__period">{tier.period}</span>}
                  </div>
                  <p className="pricing-card__desc">{tier.description}</p>
                  <PricingCta tier={tier} onContact={(event) => event.preventDefault()} />
                  <ul className="pricing-card__features">
                    {tier.features.map((feature) => (
                      <li key={feature}>
                        <Check size={14} aria-hidden="true" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <p className="pricing-footnote">
              Overage beyond your plan&apos;s monitored lines is billed per +100 lines, not hard-capped — you&apos;ll never lose monitoring at renewal. Annual billing available on Starter, Growth, and Scale.
            </p>
          </div>
        </section>

        <section className="section cta-banner">
          <div className="container cta-banner__inner">
            <Reveal>
              <h2>See what our agents find in your BOM.</h2>
              <p>Book a 20-minute walkthrough with a real BOM — yours or a sample, or explore the plans above and start free.</p>
              <div className="cta-banner__actions">
                <Link className="btn btn--primary" href="/signup">
                  Start free
                </Link>
                <a className="btn btn--ghost" href="#waitlist" onClick={openWaitlistModal}>
                  Book a Demo
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
              <p className="footer__meta">Agentic BOM management for hardware supply chains.</p>
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
                  <a href="#waitlist" onClick={openWaitlistModal}>
                    Book a demo
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
                Book a Demo
              </a>
            </div>
          </div>
        </div>
      </footer>

      <div
        id="waitlist"
        className={`modal ${isModalOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="waitlistModalTitle"
        aria-hidden={!isModalOpen}
        onClick={(event) => event.target === event.currentTarget && setIsModalOpen(false)}
      >
        <div className="modal__dialog">
          <div className="modal__header">
            <h2 id="waitlistModalTitle" className="modal__title">
              Book a demo
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
