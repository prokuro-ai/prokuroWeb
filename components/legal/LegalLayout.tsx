'use client'

import MarketingShell from '@/components/MarketingShell'

export interface LegalSection {
  id: string
  label: string
}

export function LegalNum({ n }: { n: number }) {
  return <p className="mk-eyebrow">{String(n).padStart(2, '0')}</p>
}

export default function LegalLayout({
  title,
  lead,
  updated,
  sections,
  glance,
  children,
}: {
  title: string
  lead: string
  updated: string
  sections: readonly LegalSection[]
  glance: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <MarketingShell surface="light">
      <article data-surface="light">
        <header className="border-b border-mk-line">
          <div className="mk-container py-16 sm:py-20">
            <p className="mk-eyebrow">Legal</p>
            <h1 className="mk-h1 mt-4 max-w-[16ch]">{title}</h1>
            <p className="mk-lead mt-5 max-w-[46ch] text-mk-ink-muted">{lead}</p>
          </div>
          <div className="border-t border-mk-line">
            <div className="mk-container flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="mk-eyebrow">Last updated {updated}</p>
              <p className="mk-eyebrow">Applies to prokuro.ai and the Prokuro web app</p>
            </div>
          </div>
        </header>

        <div className="mk-container grid items-start gap-12 py-14 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
          <aside className="lg:sticky lg:top-20" aria-label="On this page">
            <p className="mk-eyebrow">On this page</p>
            <nav className="mt-4 flex flex-col gap-2">
              {sections.map((section, index) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="mk-nav-link flex items-baseline gap-3 text-mk-ink-muted hover:text-mk-ink"
                >
                  <span className="mk-mono w-6 shrink-0 text-[length:var(--mk-text-xs)] text-mk-ink-subtle">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {section.label}
                </a>
              ))}
            </nav>
          </aside>

          <div>
            <div className="mk-legal-glance mb-2 border border-mk-line bg-mk-raised px-6 py-6">
              <p className="mk-eyebrow">At a glance</p>
              <ul className="mk-body mt-4 list-disc space-y-2 pl-4 text-mk-ink-muted">{glance}</ul>
            </div>
            {children}
          </div>
        </div>
      </article>
    </MarketingShell>
  )
}
