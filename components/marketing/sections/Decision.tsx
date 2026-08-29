'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Reveal from '@/components/marketing/motion/Reveal'

type Risk = 'red' | 'yellow' | 'green'

type Row = {
  refdes: string
  mpn: string
  qty: string
  risk: Risk
  headline: string
  why: { label: string; value: string; hot?: boolean }[]
  alternate: { mpn: string; note: string } | null
  action: string
}

const ROWS: Row[] = [
  {
    refdes: 'U12',
    mpn: 'STM32F407VGT6',
    qty: '1',
    risk: 'red',
    headline: 'Discontinued. Buy the alternate, not the broker stock.',
    why: [
      { label: 'Lifecycle', value: 'Discontinued', hot: true },
      { label: 'Stock', value: '0 authorised', hot: true },
      { label: 'Lead time', value: '38 weeks' },
      { label: 'Duty', value: '28.4%', hot: true },
    ],
    alternate: {
      mpn: 'STM32F407VET6',
      note: 'Same footprint and pinout, half the flash. Confirm with engineering.',
    },
    action: 'Qualify the alternate this week. Build date is 26 weeks out.',
  },
  {
    refdes: 'U7',
    mpn: 'TPS62840DLCR',
    qty: '1',
    risk: 'yellow',
    headline: 'Active, but coverage runs out before your build.',
    why: [
      { label: 'Lifecycle', value: 'Active' },
      { label: 'Stock', value: '1,840 units', hot: true },
      { label: 'Lead time', value: '22 weeks' },
      { label: 'Duty', value: '25.0%', hot: true },
    ],
    alternate: null,
    action: 'Place the buy now. Stock covers 74% of the run.',
  },
  {
    refdes: 'R44',
    mpn: 'ERJ-3EKF1002V',
    qty: '10',
    risk: 'green',
    headline: 'Clear. Cheaper at the next price break.',
    why: [
      { label: 'Lifecycle', value: 'Active' },
      { label: 'Stock', value: '1.2M units' },
      { label: 'Lead time', value: '6 weeks' },
      { label: 'Duty', value: '0%' },
    ],
    alternate: null,
    action: 'Buy through the next price break. Saves $412.',
  },
]

const RISK_COLOR: Record<Risk, string> = {
  red: 'var(--mk-red)',
  yellow: 'var(--mk-amber)',
  green: 'var(--mk-green)',
}

const RISK_LABEL: Record<Risk, string> = {
  red: 'At risk',
  yellow: 'Watch',
  green: 'Clear',
}

export default function DecisionSection() {
  const [active, setActive] = useState(0)
  const reduce = useReducedMotion()
  const row = ROWS[active]

  return (
    <section id="decisions" data-surface="light" className="mk-section">
      <div className="mk-container">
        <Reveal>
          <h2 className="mk-h2 max-w-[18ch]">
            Every line comes back as a decision.
          </h2>
          <p className="mk-lead mt-6 max-w-[46ch] text-mk-ink-muted">
            Not a status badge. What is wrong, what to buy instead, and what it costs you to wait.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-12 grid gap-px bg-mk-line lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
            {/* BOM rows */}
            <div className="bg-mk-canvas">
              <div className="grid grid-cols-[3.25rem_minmax(0,1fr)_3.25rem] gap-3 border-b border-mk-line px-5 py-3">
                <span className="mk-eyebrow">Ref</span>
                <span className="mk-eyebrow">Part</span>
                <span className="mk-eyebrow text-right">Qty</span>
              </div>
              {ROWS.map((entry, index) => {
                const on = index === active
                return (
                  <button
                    key={entry.refdes}
                    type="button"
                    onClick={() => setActive(index)}
                    aria-pressed={on}
                    className="relative grid w-full grid-cols-[3.25rem_minmax(0,1fr)_3.25rem] items-center gap-3 border-b border-mk-line px-5 py-4 text-left transition-colors duration-300"
                    style={{ background: on ? 'var(--mk-raised)' : 'transparent' }}
                  >
                    <span
                      className="absolute inset-y-0 left-0 w-0.5 transition-colors duration-300"
                      style={{ background: on ? RISK_COLOR[entry.risk] : 'transparent' }}
                    />
                    <span className="mk-data text-mk-ink-subtle">{entry.refdes}</span>
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-1.5 shrink-0 rounded-full"
                        style={{ background: RISK_COLOR[entry.risk] }}
                        aria-hidden="true"
                      />
                      <span className="mk-data truncate text-mk-ink">{entry.mpn}</span>
                    </span>
                    <span className="mk-data text-right text-mk-ink-muted">{entry.qty}</span>
                  </button>
                )
              })}
              <p className="mk-small px-5 py-4 text-mk-ink-subtle">139 more lines · 4 flagged</p>
            </div>

            {/* Decision card */}
            <div className="bg-mk-canvas p-6 sm:p-9">
              <AnimatePresence mode="wait">
                <motion.div
                  key={row.mpn}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="mk-data text-mk-ink">{row.mpn}</p>
                    <span
                      className="mk-eyebrow border px-2.5 py-1"
                      style={{
                        color: RISK_COLOR[row.risk],
                        borderColor: `color-mix(in srgb, ${RISK_COLOR[row.risk]} 40%, transparent)`,
                        background: `color-mix(in srgb, ${RISK_COLOR[row.risk]} 8%, transparent)`,
                      }}
                    >
                      {RISK_LABEL[row.risk]}
                    </span>
                  </div>

                  <h3 className="mk-h3 mt-5 max-w-[24ch]">
                    {row.headline}
                  </h3>

                  <dl className="mt-8 grid grid-cols-2 gap-px border border-mk-line bg-mk-line sm:grid-cols-4">
                    {row.why.map((item) => (
                      <div key={item.label} className="bg-mk-canvas px-4 py-3.5">
                        <dt className="mk-eyebrow">
                          {item.label}
                        </dt>
                        <dd
                          className="mk-data mt-1.5"
                          style={{ color: item.hot ? RISK_COLOR[row.risk] : 'var(--mk-ink)' }}
                        >
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {row.alternate ? (
                    <div className="mt-6 border border-mk-line bg-mk-raised px-5 py-4">
                      <p className="mk-eyebrow">
                        Recommended alternate
                      </p>
                      <p className="mk-data mt-2 text-mk-ink">{row.alternate.mpn}</p>
                      <p className="mk-small mt-2 text-mk-ink-muted">{row.alternate.note}</p>
                    </div>
                  ) : null}

                  <div className="mt-6 flex items-start gap-3 border-t border-mk-line pt-5">
                    <ArrowRight
                      size={15}
                      className="mt-0.5 shrink-0 text-mk-accent"
                      aria-hidden="true"
                    />
                    <p className="mk-body text-mk-ink">{row.action}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
