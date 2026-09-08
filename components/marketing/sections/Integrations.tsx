'use client'

import Reveal from '@/components/marketing/motion/Reveal'

const GROUPS = [
  {
    label: 'Spreadsheets',
    names: ['Excel', 'Google Sheets'],
  },
  {
    label: 'ERP',
    names: ['SAP', 'NetSuite', 'Dynamics 365'],
  },
  {
    label: 'Procurement',
    names: ['Coupa', 'SAP Ariba'],
  },
]

export default function IntegrationsSection() {
  return (
    <section id="stack" data-surface="dark" className="mk-section">
      <div className="mk-container">
        <Reveal>
          <h2 className="mk-h2 max-w-[20ch]">Works with the systems that already hold the BOM.</h2>
          <p className="mk-lead mt-6 max-w-[46ch] text-mk-ink-muted">
            Start from a spreadsheet. Connect ERP and procurement when you want the live item
            master. No rip-and-replace.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <ul className="mt-14 border-t border-mk-line">
            {GROUPS.map((group) => (
              <li
                key={group.label}
                className="grid gap-4 border-b border-mk-line py-8 md:grid-cols-[10rem_1fr] md:items-baseline md:gap-10"
              >
                <p className="mk-eyebrow">{group.label}</p>
                <p className="flex flex-wrap gap-x-10 gap-y-3">
                  {group.names.map((name) => (
                    <span key={name} className="mk-h3 text-mk-ink">
                      {name}
                    </span>
                  ))}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
