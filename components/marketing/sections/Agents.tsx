'use client'

import Reveal from '@/components/marketing/motion/Reveal'

const JOBS = [
  { name: 'Screening', role: 'EOL, NRND, and MPNs we cannot match.' },
  { name: 'Sourcing', role: 'Distributor stock you can actually buy.' },
  { name: 'Cost', role: 'Unit price at your quantity, plus duty.' },
  { name: 'Planning', role: 'When the PO has to go out to hit the build.' },
  { name: 'Compliance', role: 'Duty and restricted parties, on the line.' },
  { name: 'Buying', role: 'Approved lines, ready to place.' },
]

export default function AgentsSection() {
  return (
    <section id="product" data-surface="light" className="mk-section">
      <div className="mk-container">
        <Reveal>
          <h2 className="mk-h2 max-w-[16ch]">What we run on each line.</h2>
        </Reveal>

        <ul className="mt-16 border-t border-mk-line">
          {JOBS.map((job) => (
            <li key={job.name} className="grid gap-2 border-b border-mk-line py-7 md:grid-cols-[minmax(0,18rem)_1fr] md:items-baseline md:gap-10 md:py-9">
              <span className="mk-h3">{job.name}</span>
              <span className="mk-lead text-mk-ink-muted">{job.role}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
