import type { Metadata } from 'next'
import BookDemoPage from '@/components/schedule/BookDemoPage'
import { isCalendlyConfigured, warmEventTypeCache } from '@/lib/calendly/server'

export const metadata: Metadata = {
  title: 'Book a demo | Prokuro.ai',
  description: 'Book a 30-minute walkthrough of Prokuro, your AI procurement analyst for BOM risk.',
}

export default async function ScheduleRoute() {
  const calendlyConfigured = isCalendlyConfigured()
  if (calendlyConfigured) {
    await warmEventTypeCache()
  }

  return <BookDemoPage calendlyConfigured={calendlyConfigured} />
}
