'use client'

import Reveal from '@/components/marketing/motion/Reveal'

const STEPS = [
  {
    title: 'Hand over the BOM',
    copy: 'Any column format, however messy. Prokuro maps it once and remembers.',
    specs: [
      { label: 'Accepts', value: '.csv, .xlsx, multi-sheet' },
      { label: 'Setup', value: 'No integration' },
    ],
  },
  {
    title: 'The agents go to work',
    copy: 'Six agents run in parallel over one BOM context. What one learns, the rest act on.',
    specs: [
      { label: 'Checks', value: 'Lifecycle, stock, lead time, price, origin' },
      { label: 'Typical', value: 'Full pass under 5 min' },
    ],
  },
  {
    title: 'You approve. They execute.',
    copy: 'Each flagged line comes back with the action, the cost, and the source behind it.',
    specs: [
      { label: 'Acts', value: 'Live quotes · staged POs' },
      { label: 'Share', value: 'CSV, XLSX, or PDF' },
    ],
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" data-surface="dark" className="mk-section">
      <div className="mk-container">
        <Reveal>
          <h2 className="mk-h2 max-w-[18ch]">Three steps, no integration project.</h2>
          <p className="mk-lead mt-6 max-w-[46ch] text-mk-ink-muted">
            Nothing to install, nothing to migrate.
          </p>
        </Reveal>

        <ol className="mt-16 grid gap-px bg-mk-line md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="bg-mk-canvas p-8">
              <Reveal delay={0.08 * i}>
                <p className="mk-eyebrow">
                  Step {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="mk-h3 mt-4">{step.title}</h3>
                <p className="mk-body mt-3 text-mk-ink-muted">{step.copy}</p>
                <dl className="mt-6 space-y-3 border-t border-mk-line pt-5">
                  {step.specs.map((spec) => (
                    <div key={spec.label} className="mk-small grid grid-cols-[6rem_1fr] gap-3">
                      <dt className="font-mk-mono uppercase tracking-[0.12em] text-mk-ink-subtle">
                        {spec.label}
                      </dt>
                      <dd className="text-mk-ink-muted">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
