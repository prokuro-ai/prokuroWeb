'use client'

import { useEffect } from 'react'
import styles from './schedule.module.css'

interface CalendlyEmbedProps {
  url: string
}

/**
 * Public Calendly inline widget — used on GitHub Pages (no server API secrets).
 * Revert: remove this file and restore SSR BookDemo via /api/calendly (see docs/GITHUB-PAGES.md).
 */
export default function CalendlyEmbed({ url }: CalendlyEmbedProps) {
  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-calendly-widget]')
    if (existing) return

    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    script.dataset.calendlyWidget = 'true'
    document.body.appendChild(script)
  }, [])

  if (!url) {
    return (
      <p className={styles.embedMissing}>
        Scheduling is not configured yet. Email us to book a time.
      </p>
    )
  }

  return (
    <div
      className={`calendly-inline-widget ${styles.embed}`}
      data-url={url}
      style={{ minWidth: '320px', height: '720px' }}
    />
  )
}
