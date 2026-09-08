'use client'

import Reveal from '@/components/marketing/motion/Reveal'

const SPECS = [
  { label: 'Classifies', value: 'HTS code per line, never invented' },
  { label: 'Applies', value: 'Section 301 and 232, exclusions, special rates' },
  { label: 'Screens', value: 'Manufacturers against the BIS Entity List' },
  { label: 'Prices', value: 'Duty as a share of BOM value at your volume' },
]

export default function TariffSection() {
  return (
    <section data-surface="light" className="mk-section">
      <div className="mk-container">
        <Reveal>
          <h2 className="mk-h2 max-w-[24ch]">
            Trade exposure priced into every decision, not filed in a separate spreadsheet.
          </h2>
          <p className="mk-lead mt-6 max-w-[52ch] text-mk-ink-muted">
            A part that saves eleven cents and lands in a 25% duty bracket is not a saving.
            Origin, rate, and Entity List status sit on the same line as stock and lifecycle,
            so the landed cost is in the call, not a workbook you open later.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <dl className="mt-14 border-t border-mk-line">
            {SPECS.map((spec) => (
              <div
                key={spec.label}
                className="grid gap-2 border-b border-mk-line py-6 md:grid-cols-[10rem_1fr] md:items-baseline md:gap-10 md:py-7"
              >
                <dt className="mk-eyebrow">{spec.label}</dt>
                <dd className="mk-lead text-mk-ink">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  )
}
