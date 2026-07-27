'use client'

import { Check } from 'lucide-react'
import MarketingShell from '@/components/MarketingShell'
import { DEMO_AGENDA } from '@/lib/schedule/meeting'
import { SALES_EMAIL, SALES_MAILTO } from '@/lib/sales'
import BookDemo from './BookDemo'
import CalendlyEmbed from './CalendlyEmbed'
import styles from './schedule.module.css'

interface BookDemoPageProps {
  /** SSR + custom Scheduling API widget */
  calendlyConfigured?: boolean
  /** GitHub Pages / static: public Calendly scheduling URL */
  embedUrl?: string
  mode?: 'api' | 'embed'
}

export default function BookDemoPage({
  calendlyConfigured = false,
  embedUrl = '',
  mode = 'api',
}: BookDemoPageProps) {
  const useEmbed = mode === 'embed'

  return (
    <MarketingShell>
      <main className={styles.page}>
        <div className="container">
          <header className={styles.header}>
            <h1 className={styles.title}>Book a demo</h1>
            <p className={styles.subtitle}>
              Thirty minutes with the team, run against a real BOM of yours. No slideware.
            </p>
          </header>

          <div className={styles.card}>
            {useEmbed ? (
              <CalendlyEmbed url={embedUrl} />
            ) : (
              <BookDemo configured={calendlyConfigured} />
            )}
          </div>

          <ul className={styles.agenda}>
            {DEMO_AGENDA.map((item) => (
              <li key={item} className={styles.agendaItem}>
                <Check size={16} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>

          <section className={styles.contact} aria-labelledby="contact-sales-title">
            <div className={styles.contactCopy}>
              <h2 id="contact-sales-title" className={styles.contactTitle}>
                Prefer email?
              </h2>
              <p className={styles.contactBody}>
                Write to {SALES_EMAIL} and we reply within one business day.
              </p>
            </div>

            <a className={styles.contactAction} href={SALES_MAILTO}>
              Email sales
            </a>
          </section>
        </div>
      </main>
    </MarketingShell>
  )
}
