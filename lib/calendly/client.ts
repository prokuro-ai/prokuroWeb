import { calendlyApiBase } from '@/lib/calendly/config'
import type { BookingConfirmation, BookingRequest } from '@/lib/calendly/types'

const API_BASE = calendlyApiBase()

function endpoint(path: string): string {
  return `${API_BASE}${path}`
}

async function readError(response: Response, fallback: string): Promise<string> {
  const data = (await response.json().catch(() => null)) as { error?: string } | null
  return data?.error ?? fallback
}

/** ISO start times open for booking between `start` and `end`. */
export async function fetchAvailability(start: Date, end: Date): Promise<string[]> {
  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
  })

  const response = await fetch(endpoint(`/api/calendly/availability?${params.toString()}`))
  if (!response.ok) {
    throw new Error(await readError(response, 'Could not load available times'))
  }

  const data = (await response.json()) as { slots?: string[] }
  return data.slots ?? []
}

export async function createBooking(input: BookingRequest): Promise<BookingConfirmation> {
  const response = await fetch(endpoint('/api/calendly/book'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await readError(response, 'Could not complete your booking'))
  }

  const data = (await response.json()) as { booking?: BookingConfirmation }
  if (!data.booking) {
    throw new Error('Could not complete your booking')
  }

  return data.booking
}

export async function cancelBooking(eventUri: string, reason?: string): Promise<void> {
  const response = await fetch(endpoint('/api/calendly/cancel'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventUri, reason }),
  })

  if (!response.ok) {
    throw new Error(await readError(response, 'Could not cancel your booking'))
  }
}
