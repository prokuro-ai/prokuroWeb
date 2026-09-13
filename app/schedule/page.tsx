import type { Metadata } from 'next'
import BookDemoPage from '@/components/schedule/BookDemoPage'
import { calendlyApiBase } from '@/lib/calendly/config'
import { PAGE, pageMetadata } from '@/lib/pageTitle'
import { isStaticExport } from '@/lib/static-export'

export const metadata: Metadata = pageMetadata(PAGE.schedule, {
  description: 'Book 30 minutes on a real BOM.',
})

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
