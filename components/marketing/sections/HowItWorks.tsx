'use client'

import Reveal from '@/components/marketing/motion/Reveal'

const STEPS = [
  {
    title: 'Connect the BOM',
    copy: 'The item master in ERP, the live list in procurement, or the workbook that still holds it. We map it once.',
  },
  {
    title: 'Run the lines',
    copy: 'Stock, lifecycle, cost, lead time, and trade against that same BOM.',
  },
  {
    title: 'Place the buy',
    copy: 'Each flagged line has an action, a cost, and where the number came from.',
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" data-surface="dark" className="mk-section">
      <div className="mk-container">
        <Reveal>
          <h2 className="mk-h2 max-w-[20ch]">Start from the BOM you already run.</h2>
          <p className="mk-lead mt-6 max-w-[46ch] text-mk-ink-muted">
            The system of record stays put. We work against it.
          </p>
        </Reveal>

        <ol className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <Reveal delay={0.08 * i}>
                <p className="mk-eyebrow">
                  Step {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="mk-h3 mt-4">{step.title}</h3>
                <p className="mk-body mt-3 text-mk-ink-muted">{step.copy}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
