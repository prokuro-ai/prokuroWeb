import type { BookingConfirmation, BookingRequest } from '@/lib/calendly/types'

const CALENDLY_API_BASE = 'https://api.calendly.com'

export class CalendlyApiError extends Error {
  readonly status: number
  readonly retryAfterSeconds?: number

  constructor(message: string, status: number, retryAfterSeconds?: number) {
    super(message)
    this.name = 'CalendlyApiError'
    this.status = status
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export function calendlyRouteStatus(error: unknown): number {
  if (error instanceof CalendlyApiError) {
    if (error.status === 429) return 429
    if (error.status >= 400 && error.status < 500) return error.status
  }
  return 502
}

interface CalendlyConfig {
  token: string
  eventTypeUri: string
  locationKind?: string
}

interface EventTypeDetails {
  locationKind: string | null
  prepQuestion: { question: string; position: number } | null
}

let cachedEventType: { uri: string; details: EventTypeDetails } | null = null

export function getCalendlyConfig(): CalendlyConfig | null {
  const token = process.env.CALENDLY_API_TOKEN?.trim()
  const eventTypeUri = process.env.CALENDLY_EVENT_TYPE_URI?.trim()
  if (!token || !eventTypeUri) return null
  if (!eventTypeUri.startsWith('https://api.calendly.com/event_types/')) return null

  const locationKind = process.env.CALENDLY_LOCATION_KIND?.trim()
  return { token, eventTypeUri, locationKind: locationKind || undefined }
}

export function isCalendlyConfigured(): boolean {
  return getCalendlyConfig() !== null
}

function formatCalendlyError(body: unknown, status: number): string {
  if (typeof body !== 'object' || body === null) {
    return `Calendly request failed (${status})`
  }

  const record = body as { message?: string; details?: Array<{ message?: string; parameter?: string; code?: string }> }
  const detail = record.details?.[0]
  const detailText = detail
    ? [detail.message, detail.parameter, detail.code].filter(Boolean).join(' — ')
    : null

  if (record.message && detailText) return `${record.message} (${detailText})`
  if (record.message) return record.message
  return `Calendly request failed (${status})`
}

async function calendlyRequest<T>(config: CalendlyConfig, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${CALENDLY_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const retryAfterHeader = response.headers.get('retry-after')
    const retryAfterSeconds = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : undefined
    const message =
      response.status === 429
        ? 'Please wait a few minutes and try again.'
        : formatCalendlyError(body, response.status)

    throw new CalendlyApiError(
      message,
      response.status,
      Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
    )
  }

  return body as T
}

async function getEventTypeDetails(config: CalendlyConfig): Promise<EventTypeDetails> {
  if (cachedEventType?.uri === config.eventTypeUri) {
    return cachedEventType.details
  }

  const data = await calendlyRequest<{
    resource?: {
      locations?: Array<{ kind?: string }>
      custom_questions?: Array<{ name?: string; position?: number; enabled?: boolean; type?: string }>
    }
  }>(config, config.eventTypeUri.replace(CALENDLY_API_BASE, ''))

  const prepQuestion =
    data.resource?.custom_questions?.find(
      (item) => item.enabled !== false && item.name != null && typeof item.position === 'number',
    ) ?? null

  const details: EventTypeDetails = {
    locationKind: data.resource?.locations?.[0]?.kind ?? null,
    prepQuestion: prepQuestion
      ? { question: prepQuestion.name!, position: prepQuestion.position! }
      : null,
  }

  cachedEventType = { uri: config.eventTypeUri, details }
  return details
}

async function resolveLocationKind(
  config: CalendlyConfig,
  eventType: EventTypeDetails,
): Promise<string | null> {
  if (config.locationKind) return config.locationKind
  return eventType.locationKind
}

/** Preload event type metadata so booking only needs one Calendly POST. */
export async function warmEventTypeCache(): Promise<void> {
  const config = getCalendlyConfig()
  if (!config) return
  try {
    await getEventTypeDetails(config)
  } catch {
    // Page can still render; booking will surface the error.
  }
}

/** ISO start times that are still open for booking, oldest first. */
export async function listAvailableTimes(input: { startTime: Date; endTime: Date }): Promise<string[]> {
  const config = getCalendlyConfig()
  if (!config) return []

  const params = new URLSearchParams({
    event_type: config.eventTypeUri,
    start_time: input.startTime.toISOString(),
    end_time: input.endTime.toISOString(),
  })

  const data = await calendlyRequest<{
    collection?: Array<{ status?: string; start_time?: string }>
  }>(config, `/event_type_available_times?${params.toString()}`)

  return (data.collection ?? [])
    .filter((slot) => slot.status === 'available' && slot.start_time)
    .map((slot) => slot.start_time!)
}

export async function createInvitee(input: BookingRequest): Promise<BookingConfirmation> {
  const config = getCalendlyConfig()
  if (!config) {
    throw new Error('Calendly is not configured')
  }

  const eventType = await getEventTypeDetails(config)
  const locationKind = await resolveLocationKind(config, eventType)
  if (!locationKind) {
    throw new Error('Could not determine meeting location for this event type')
  }

  const notes = input.notes?.trim()
  const phone = input.phone?.trim()

  const invitee: Record<string, string> = {
    name: `${input.firstName.trim()} ${input.lastName.trim()}`.trim(),
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    email: input.email.trim(),
    timezone: input.timezone,
  }

  // Calendly docs: optional invitee.text_reminder_number (E.164) for SMS reminders.
  if (phone) {
    invitee.text_reminder_number = phone
  }

  const payload: Record<string, unknown> = {
    event_type: config.eventTypeUri,
    start_time: input.startTime,
    invitee,
    location: { kind: locationKind },
  }

  if (notes && eventType.prepQuestion) {
    payload.questions_and_answers = [
      {
        question: eventType.prepQuestion.question,
        answer: notes,
        position: eventType.prepQuestion.position,
      },
    ]
  }

  const data = await calendlyRequest<{
    resource?: { event?: string }
  }>(config, '/invitees', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const resource = data.resource
  if (!resource?.event) {
    throw new Error('Calendly did not return booking details')
  }

  return {
    eventUri: resource.event,
    startTime: input.startTime,
    timezone: input.timezone,
  }
}

/** Cancel a scheduled event via Calendly API. */
export async function cancelScheduledEvent(eventUri: string, reason?: string): Promise<void> {
  const config = getCalendlyConfig()
  if (!config) {
    throw new Error('Calendly is not configured')
  }

  if (!eventUri.startsWith(`${CALENDLY_API_BASE}/scheduled_events/`)) {
    throw new Error('Invalid event')
  }

  const path = `${eventUri.replace(CALENDLY_API_BASE, '')}/cancellation`
  try {
    await calendlyRequest(config, path, {
      method: 'POST',
      body: JSON.stringify(reason?.trim() ? { reason: reason.trim() } : {}),
    })
  } catch (error) {
    // Idempotent: canceling twice should still succeed for the user.
    if (error instanceof CalendlyApiError && /already canceled/i.test(error.message)) {
      return
    }
    throw error
  }
}
