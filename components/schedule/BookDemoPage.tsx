'use client'

import MarketingShell from '@/components/MarketingShell'
import { SALES_EMAIL, SALES_MAILTO } from '@/lib/sales'
import BookDemo from './BookDemo'
import styles from './schedule.module.css'

interface BookDemoPageProps {
  calendlyConfigured?: boolean
}

export default function BookDemoPage({ calendlyConfigured = false }: BookDemoPageProps) {
  return (
    <MarketingShell surface="dark">
      <main className={styles.page}>
        <section data-surface="dark" className={styles.hero}>
          <div className={`mk-grain ${styles.heroGrain}`} aria-hidden="true" />
          <div className="mk-container">
            <div className={styles.heroInner}>
              <h1 className={`mk-h1 ${styles.title}`}>Book a demo</h1>
              <p className={`mk-lead ${styles.subtitle}`}>
                Thirty minutes, run against a real BOM of yours. No slideware.
              </p>
            </div>
          </div>
        </section>

        <section data-surface="light" className={styles.body}>
          <div className="mk-container">
            <div className={styles.card}>
              <BookDemo configured={calendlyConfigured} />
            </div>

            <p className={styles.contactLine}>
              Prefer email? Write to{' '}
              <a className={styles.contactEmail} href={SALES_MAILTO}>
                {SALES_EMAIL}
              </a>{' '}
              and we reply within one business day.
            </p>
          </div>
        </section>
      </main>
    </MarketingShell>
  )
}
