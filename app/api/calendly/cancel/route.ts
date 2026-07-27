import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import {
  calendlyRouteStatus,
  cancelScheduledEvent,
  getCalendlyConfig,
} from '@/lib/calendly/server'

const cancelSchema = z.object({
  eventUri: z
    .string({ required_error: 'Missing event' })
    .min(1, 'Missing event')
    .refine((value) => value.startsWith('https://api.calendly.com/scheduled_events/'), {
      message: 'Invalid event',
    }),
  reason: z.string().trim().max(1000).optional(),
})

export async function POST(req: NextRequest) {
  if (!getCalendlyConfig()) {
    return NextResponse.json({ error: 'Calendly is not configured' }, { status: 503 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = cancelSchema.safeParse(json)
  if (!parsed.success) {
    const detail = parsed.error.issues[0]?.message ?? 'Invalid cancel request'
    return NextResponse.json({ error: detail }, { status: 400 })
  }

  try {
    await cancelScheduledEvent(parsed.data.eventUri, parsed.data.reason)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel booking'
    return NextResponse.json({ error: message }, { status: calendlyRouteStatus(error) })
  }
}
