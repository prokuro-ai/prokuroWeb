'use client'

import { AlertTriangle } from 'lucide-react'
import Reveal from '@/components/marketing/motion/Reveal'

const SPECS = [
  { label: 'Classifies', value: 'HTS code per line, never invented' },
  { label: 'Applies', value: 'Section 301 and 232, exclusions, special rates' },
  { label: 'Screens', value: 'Manufacturers against the BIS Entity List' },
  { label: 'Prices', value: 'Duty as a share of BOM value at your volume' },
]

const COMPOSITION = [
  { label: 'Section 301 exposed', share: 18, color: 'var(--mk-red)' },
  { label: 'Other dutiable', share: 22, color: 'var(--mk-amber)' },
  { label: 'Duty free', share: 60, color: 'var(--mk-slate)' },
]

const LINES = [
  { mpn: 'STM32F407VGT6', origin: 'CN', hts: '8542.31.00', duty: '28.4%', hot: true },
  { mpn: 'TPS62840DLCR', origin: 'CN', hts: '8504.40.95', duty: '25.0%', hot: true },
  { mpn: 'ECS-160-20-3X', origin: 'TW', hts: '8541.60.00', duty: '3.4%', hot: false },
]

export default function TariffSection() {
  return (
    <section data-surface="light" className="mk-section">
      <div className="mk-container grid items-start gap-14 lg:grid-cols-2">
        <Reveal>
          <h2 className="mk-h2 max-w-[18ch]">
            Trade exposure priced into every decision, not filed in a separate spreadsheet.
          </h2>
          <p className="mk-lead mt-6 max-w-[42ch] text-mk-ink-muted">
            A part that saves eleven cents and lands in a 25% duty bracket is not a saving.
          </p>

          <dl className="mt-10 border-t border-mk-line">
            {SPECS.map((spec) => (
              <div
                key={spec.label}
                className="grid gap-2 border-b border-mk-line py-4 sm:grid-cols-[7rem_1fr] sm:gap-6"
              >
                <dt className="mk-eyebrow">{spec.label}</dt>
                <dd className="mk-body text-mk-ink-muted">{spec.value}</dd>
              </div>
            ))}
          </dl>

          <p className="mk-eyebrow mt-6 leading-5">
            Planning estimates · not a customs-broker classification
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="border border-mk-line bg-mk-raised">
            <div className="flex items-center justify-between gap-4 border-b border-mk-line px-6 py-4">
              <p className="mk-eyebrow">agent · comply</p>
              <span className="mk-eyebrow border border-mk-line bg-mk-canvas px-2 py-1 text-mk-red">
                18% at risk
              </span>
            </div>

            <div className="px-6 py-6">
              <div className="flex items-baseline justify-between gap-4">
                <p className="mk-eyebrow">Duty as share of BOM value</p>
                <p className="mk-mono text-[length:var(--mk-text-2xl)] tabular-nums">7.4%</p>
              </div>

              <div className="mt-5 flex h-2.5 w-full overflow-hidden rounded-sm">
                {COMPOSITION.map((band) => (
                  <div
                    key={band.label}
                    style={{ width: `${band.share}%`, background: band.color }}
                    title={`${band.label} · ${band.share}%`}
                  />
                ))}
              </div>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                {COMPOSITION.map((band) => (
                  <li key={band.label} className="flex items-center gap-2">
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: band.color }}
                      aria-hidden="true"
                    />
                    <span className="mk-small text-mk-ink-muted">{band.label}</span>
                    <span className="mk-data text-mk-ink">{band.share}%</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-mk-line">
              <div className="grid grid-cols-[1fr_2.5rem_5.5rem_3.5rem] gap-3 border-b border-mk-line px-6 py-2.5">
                {['Line', 'COO', 'HTS', 'Duty'].map((head) => (
                  <span
                    key={head}
                    className="mk-eyebrow last:text-right"
                  >
                    {head}
                  </span>
                ))}
              </div>
              {LINES.map((line) => (
                <div
                  key={line.mpn}
                  className="grid grid-cols-[1fr_2.5rem_5.5rem_3.5rem] items-center gap-3 border-b border-mk-line px-6 py-3"
                >
                  <span className="mk-data truncate text-mk-ink">{line.mpn}</span>
                  <span className="mk-data text-mk-ink-muted">{line.origin}</span>
                  <span className="mk-data text-mk-ink-muted">{line.hts}</span>
                  <span
                    className="mk-data text-right"
                    style={{ color: line.hot ? 'var(--mk-red)' : 'var(--mk-ink)' }}
                  >
                    {line.duty}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 border-b border-mk-line px-6 py-4">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-mk-amber" aria-hidden="true" />
              <p className="mk-small text-mk-ink-muted">
                <span className="text-mk-ink">2 manufacturers</span> matched the BIS Entity List.
                Escalated before either reached a PO.
              </p>
            </div>

            <div className="flex items-end justify-between gap-4 px-6 py-5">
              <p className="mk-body text-mk-ink-muted">Added cost at 2,500 units</p>
              <p className="mk-mono text-[length:var(--mk-text-lg)] tabular-nums text-mk-ink">
                $41,200
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
