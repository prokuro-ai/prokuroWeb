'use client'

import Reveal from '@/components/marketing/motion/Reveal'

const STEPS = [
  {
    title: 'Hand over the BOM',
    copy: 'Any column format, however messy. Prokuro maps it once and remembers.',
  },
  {
    title: 'The agents go to work',
    copy: 'Six agents run in parallel over one BOM context. What one learns, the rest act on.',
  },
  {
    title: 'You approve. They execute.',
    copy: 'Each flagged line comes back with the action, the cost, and the source behind it.',
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" data-surface="dark" className="mk-section">
      <div className="mk-container">
        <Reveal>
          <h2 className="mk-h2 max-w-[18ch]">Three steps. Start from the file you have.</h2>
          <p className="mk-lead mt-6 max-w-[46ch] text-mk-ink-muted">
            Spreadsheet today. ERP and procurement when you are ready.
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
