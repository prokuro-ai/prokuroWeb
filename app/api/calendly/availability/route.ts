import { NextResponse, type NextRequest } from 'next/server'
import { getCalendlyConfig, listAvailableTimes, calendlyRouteStatus } from '@/lib/calendly/server'
import { resolveAvailabilityRange } from '@/lib/calendly/validation'

export async function GET(req: NextRequest) {
  if (!getCalendlyConfig()) {
    return NextResponse.json({ error: 'Calendly is not configured' }, { status: 503 })
  }

  const range = resolveAvailabilityRange(
    req.nextUrl.searchParams.get('start'),
    req.nextUrl.searchParams.get('end'),
  )

  if (!range) {
    return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
  }

  try {
    const slots = await listAvailableTimes(range)
    return NextResponse.json({ slots })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load availability'
    return NextResponse.json({ error: message }, { status: calendlyRouteStatus(error) })
  }
}
