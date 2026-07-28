import { z } from 'zod'

/**
 * Request validation shared by the Next.js API routes (local dev, SSR hosts)
 * and the Cloudflare Worker (static hosting). Both entry points must accept
 * exactly the same input, so the rules live here rather than in either adapter.
 */

const AVAILABILITY_MAX_RANGE_MS = 7 * 24 * 60 * 60 * 1000

export const bookSchema = z.object({
  startTime: z.string().datetime(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  timezone: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(2000).optional(),
})

export const cancelSchema = z.object({
  eventUri: z
    .string({ required_error: 'Missing event' })
    .min(1, 'Missing event')
    .refine((value) => value.startsWith('https://api.calendly.com/scheduled_events/'), {
      message: 'Invalid event',
    }),
  reason: z.string().trim().max(1000).optional(),
})

export interface AvailabilityRange {
  startTime: Date
  endTime: Date
}

/**
 * Clamp a visitor-supplied window to something bookable: never in the past and
 * never wider than a week (Calendly rejects longer ranges).
 * Returns null when either bound is unparseable.
 */
export function resolveAvailabilityRange(
  startParam: string | null,
  endParam: string | null,
): AvailabilityRange | null {
  const now = new Date()
  const requestedStart = startParam ? new Date(startParam) : now
  const requestedEnd = endParam
    ? new Date(endParam)
    : new Date(now.getTime() + AVAILABILITY_MAX_RANGE_MS)

  if (Number.isNaN(requestedStart.getTime()) || Number.isNaN(requestedEnd.getTime())) {
    return null
  }

  const startTime = new Date(Math.max(requestedStart.getTime(), now.getTime() + 60_000))
  let endTime = requestedEnd

  if (endTime.getTime() <= startTime.getTime()) {
    endTime = new Date(startTime.getTime() + AVAILABILITY_MAX_RANGE_MS)
  }

  if (endTime.getTime() - startTime.getTime() > AVAILABILITY_MAX_RANGE_MS) {
    endTime = new Date(startTime.getTime() + AVAILABILITY_MAX_RANGE_MS)
  }

  return { startTime, endTime }
}
