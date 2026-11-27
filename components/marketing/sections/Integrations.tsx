'use client'

import { useState } from 'react'
import { ProkuroMark } from '@/components/brand/ProkuroLogo'
import Reveal from '@/components/marketing/motion/Reveal'
import { SALES_EMAIL } from '@/lib/sales'

const INNER = [
  { id: 'sap', name: 'SAP' },
  { id: 'netsuite', name: 'NetSuite' },
  { id: 'dynamics', name: 'Dynamics 365' },
  { id: 'epicor', name: 'Epicor' },
] as const

const OUTER = [
  { id: 'fishbowl', name: 'Fishbowl' },
  { id: 'katana', name: 'Katana' },
  { id: 'excel', name: 'Excel' },
  { id: 'sheets', name: 'Google Sheets' },
] as const

const MAILTO = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent('Prokuro integration')}`

function ToolGlyph({ id }: { id: string }) {
  const props = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  switch (id) {
    case 'sap':
      return (
        <svg {...props}>
          <path d="M5 17 L12 6 L19 17" />
          <path d="M8 17h8" />
        </svg>
      )
    case 'netsuite':
      return (
        <svg {...props}>
          <rect x="4" y="4" width="7" height="7" rx="1.2" />
          <rect x="13" y="4" width="7" height="7" rx="1.2" />
          <rect x="4" y="13" width="7" height="7" rx="1.2" />
          <rect x="13" y="13" width="7" height="7" rx="1.2" />
        </svg>
      )
    case 'dynamics':
      return (
        <svg {...props}>
          <circle cx="8" cy="8" r="3" />
          <circle cx="16" cy="8" r="3" />
          <circle cx="8" cy="16" r="3" />
          <circle cx="16" cy="16" r="3" />
        </svg>
      )
    case 'epicor':
      return (
        <svg {...props}>
          <path d="M12 3 L20 7.5 V16.5 L12 21 L4 16.5 V7.5 Z" />
          <circle cx="12" cy="12" r="2.2" />
        </svg>
      )
    case 'fishbowl':
      return (
        <svg {...props}>
          <path d="M4 13c2.2-4 5-6 8.2-6 3.4 0 5.6 2.2 7.8 2.2" />
          <path d="M4 13c2.4 3.2 5 5 8.2 5 2.6 0 4.6-1.2 6.4-3" />
          <circle cx="15.5" cy="11.2" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'katana':
      return (
        <svg {...props}>
          <path d="M5 18 L16 5" />
          <path d="M14 5h4v4" />
          <path d="M6 16l-2 3" />
        </svg>
      )
    case 'excel':
      return (
        <svg {...props}>
          <rect x="4" y="3" width="16" height="18" rx="1.5" />
          <path d="M4 9h16M4 15h16M10 3v18" />
        </svg>
      )
    default:
      return (
        <svg {...props}>
          <path d="M7 3h8l5 5v13H7z" />
          <path d="M15 3v5h5" />
          <path d="M9 13h6M9 17h6" />
        </svg>
      )
  }
}

function Orbit({
  tools,
  radius,
  duration,
  reverse = false,
  openId,
  onToggle,
}: {
  tools: readonly { id: string; name: string }[]
  radius: number
  duration: string
  reverse?: boolean
  openId: string | null
  onToggle: (id: string) => void
}) {
  return (
    <div
      className={`mk-orbit__ring${reverse ? ' mk-orbit__ring--reverse' : ''}`}
      style={{ ['--mk-orbit-duration' as string]: duration }}
    >
      <div className="mk-orbit__track" style={{ ['--mk-orbit-r' as string]: `${radius}%` }} />
      {tools.map((tool, index) => {
        const angle = (Math.PI * 2 * index) / tools.length - Math.PI / 2
        const left = 50 + Math.cos(angle) * radius
        const top = 50 + Math.sin(angle) * radius
        return (
          <div key={tool.id} className="mk-orbit__node" style={{ left: `${left}%`, top: `${top}%` }}>
            <div className="mk-orbit__face">
              <button
                type="button"
                className="mk-orbit__icon"
                aria-label={tool.name}
                aria-expanded={openId === tool.id}
                onClick={() => onToggle(tool.id)}
              >
                <ToolGlyph id={tool.id} />
              </button>
              <span className={`mk-orbit__name${openId === tool.id ? ' is-open' : ''}`}>{tool.name}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function IntegrationsSection() {
  const [openId, setOpenId] = useState<string | null>(null)
  const toggle = (id: string) => setOpenId((current) => (current === id ? null : id))

  return (
    <section id="stack" data-surface="light" className="mk-section mk-section--fit">
      <div className="mk-container">
        <div className="grid justify-items-center gap-8 lg:grid-cols-[minmax(0,1fr)_23.5rem] lg:items-center lg:justify-items-stretch lg:gap-12">
          <div className="w-full text-center lg:text-left">
            <Reveal>
              <h2 className="mk-h2 mx-auto max-w-[16ch] lg:mx-0">Leave the BOM where it lives.</h2>
              <p className="mk-body mx-auto mt-5 max-w-[36ch] text-mk-ink-muted lg:mx-0">
                Missing a system?{' '}
                <a href={MAILTO} className="mk-inline-link text-mk-ink">
                  Email us
                </a>{' '}
                and we will tell you if we can read that BOM.
              </p>
            </Reveal>
          </div>

          <div className="flex w-full justify-center">
            <div className="mk-orbit">
              <Orbit tools={OUTER} radius={32} duration="96s" openId={openId} onToggle={toggle} />
              <Orbit tools={INNER} radius={19} duration="72s" reverse openId={openId} onToggle={toggle} />
              <div className="mk-orbit__hub">
                <ProkuroMark size={28} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
