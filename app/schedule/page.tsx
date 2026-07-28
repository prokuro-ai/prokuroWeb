import type { Metadata } from 'next'
import BookDemoPage from '@/components/schedule/BookDemoPage'
import { isStaticExport } from '@/lib/static-export'

export const metadata: Metadata = {
  title: 'Book a demo | Prokuro.ai',
  description: 'Book a 30-minute walkthrough of Prokuro, your AI procurement analyst for BOM risk.',
}

export default async function ScheduleRoute() {
  // Static hosting cannot read secrets or run /api/calendly/*, so the widget
  // talks to the Cloudflare Worker instead (see docs/GITHUB-PAGES.md).
  if (isStaticExport()) {
    const proxyConfigured = Boolean(process.env.NEXT_PUBLIC_CALENDLY_API_BASE?.trim())
    return <BookDemoPage calendlyConfigured={proxyConfigured} />
  }

  const { isCalendlyConfigured, warmEventTypeCache } = await import('@/lib/calendly/server')
  const calendlyConfigured = isCalendlyConfigured()
  if (calendlyConfigured) {
    await warmEventTypeCache()
  }

  return <BookDemoPage calendlyConfigured={calendlyConfigured} />
}
