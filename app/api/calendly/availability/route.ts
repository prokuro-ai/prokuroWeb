import { NextResponse, type NextRequest } from 'next/server'
import { getCalendlyConfig, listAvailableTimes, calendlyRouteStatus } from '@/lib/calendly/server'

const MAX_RANGE_MS = 7 * 24 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  if (!getCalendlyConfig()) {
    return NextResponse.json({ error: 'Calendly is not configured' }, { status: 503 })
  }

  const startParam = req.nextUrl.searchParams.get('start')
  const endParam = req.nextUrl.searchParams.get('end')

  const now = new Date()
  const requestedStart = startParam ? new Date(startParam) : now
  const requestedEnd = endParam ? new Date(endParam) : new Date(now.getTime() + MAX_RANGE_MS)

  if (Number.isNaN(requestedStart.getTime()) || Number.isNaN(requestedEnd.getTime())) {
    return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
  }

  const startTime = new Date(Math.max(requestedStart.getTime(), now.getTime() + 60_000))
  let endTime = requestedEnd

  if (endTime.getTime() <= startTime.getTime()) {
    endTime = new Date(startTime.getTime() + MAX_RANGE_MS)
  }

  if (endTime.getTime() - startTime.getTime() > MAX_RANGE_MS) {
    endTime = new Date(startTime.getTime() + MAX_RANGE_MS)
  }

  try {
    const slots = await listAvailableTimes({ startTime, endTime })
    return NextResponse.json({ slots })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load availability'
    return NextResponse.json({ error: message }, { status: calendlyRouteStatus(error) })
  }
}
