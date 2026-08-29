import type { Metadata } from 'next'
import BookDemoPage from '@/components/schedule/BookDemoPage'
import { calendlyApiBase } from '@/lib/calendly/config'
import { isStaticExport } from '@/lib/static-export'

export const metadata: Metadata = {
  title: 'Book a demo',
  description: 'Book a 30-minute walkthrough of Prokuro, your AI procurement analyst for BOM risk.',
}

export default async function ScheduleRoute() {
  // Static hosting cannot read secrets or run /api/calendly/*, so the widget
  // talks to the Cloudflare Worker instead (see GITHUB-PAGES.md).
  if (isStaticExport()) {
    return <BookDemoPage calendlyConfigured={Boolean(calendlyApiBase())} />
  }

  const { isCalendlyConfigured, warmEventTypeCache } = await import('@/lib/calendly/server')
  const calendlyConfigured = isCalendlyConfigured()
  if (calendlyConfigured) {
    await warmEventTypeCache()
  }

  return <BookDemoPage calendlyConfigured={calendlyConfigured} />
}
