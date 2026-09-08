'use client'

import { Link } from '@/lib/navigation'
import type { RiskLevel } from '@/lib/types'

export type DecisionChip = {
  label: string
  value: string
  hot?: boolean
}

const RISK_COLOR: Record<RiskLevel, string> = {
  red: 'var(--mk-red)',
  yellow: 'var(--mk-amber)',
  green: 'var(--mk-green)',
  unknown: 'var(--mk-slate)',
}

export default function DecisionRow({
  risk,
  headline,
  mpn,
  meta,
  chips,
  href,
}: {
  risk: RiskLevel
  headline: string
  mpn: string | null
  meta?: string
  chips: DecisionChip[]
  href?: string
}) {
  const color = RISK_COLOR[risk]
  const body = (
    <>
      <span
        className="absolute inset-y-0 left-0 w-0.5"
        style={{ background: risk === 'green' || risk === 'unknown' ? 'transparent' : color }}
        aria-hidden
      />
      <p className="mk-app-heading text-mk-ink">{headline}</p>
      <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className="mk-data truncate text-mk-ink">{mpn ?? '—'}</span>
        {meta ? (
          <>
            <span className="text-mk-line-strong" aria-hidden>
              ·
            </span>
            <span className="truncate text-[13px] text-mk-ink-muted">{meta}</span>
          </>
        ) : null}
      </div>
      {chips.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {chips.map((chip) => (
            <li key={`${chip.label}-${chip.value}`} className="flex items-baseline gap-1.5">
              <span className="mk-eyebrow">{chip.label}</span>
              <span
                className="mk-data text-[12px]"
                style={{ color: chip.hot ? color : 'var(--mk-ink-muted)' }}
              >
                {chip.value}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  )
  const surface = 'bg-mk-canvas hover:bg-mk-raised/80'

  if (href) {
    return (
      <Link
        href={href}
        className={`relative block border-b border-mk-line/60 px-4 py-3 transition-colors last:border-b-0 mk:px-5 mk:py-4 ${surface}`}
      >
        {body}
      </Link>
    )
  }

  return (
    <div className={`relative border-b border-mk-line/60 px-4 py-3 last:border-b-0 mk:px-5 mk:py-4 ${surface}`}>
      {body}
    </div>
  )
}
