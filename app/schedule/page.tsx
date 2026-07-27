import type { Metadata } from 'next'
import BookDemoPage from '@/components/schedule/BookDemoPage'
import { isStaticExport } from '@/lib/static-export'

export const metadata: Metadata = {
  title: 'Book a demo | Prokuro.ai',
  description: 'Book a 30-minute walkthrough of Prokuro, your AI procurement analyst for BOM risk.',
}

export default async function ScheduleRoute() {
  // GitHub Pages: no server secrets — public Calendly embed only.
  // SSR/Amplify: keep custom Scheduling API widget (see docs/GITHUB-PAGES.md to revert).
  if (isStaticExport()) {
    return (
      <BookDemoPage
        mode="embed"
        embedUrl={process.env.NEXT_PUBLIC_CALENDLY_URL?.trim() ?? ''}
      />
    )
  }

  const { isCalendlyConfigured, warmEventTypeCache } = await import('@/lib/calendly/server')
  const calendlyConfigured = isCalendlyConfigured()
  if (calendlyConfigured) {
    await warmEventTypeCache()
  }

  return <BookDemoPage mode="api" calendlyConfigured={calendlyConfigured} />
}
