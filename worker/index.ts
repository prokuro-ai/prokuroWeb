/**
 * Calendly proxy for the statically hosted site.
 *
 * GitHub Pages serves files only, so the browser cannot reach the Next.js
 * routes under /api/calendly/*. This Worker exposes those same three paths
 * backed by the same lib/calendly code, which keeps CALENDLY_API_TOKEN off the
 * client. Local dev and SSR hosts continue to use the Next.js routes directly.
 *
 * Deploy: npm run worker:deploy (see docs/GITHUB-PAGES.md)
 */
import { toE164Phone } from '../lib/calendly/phone'
import {
  calendlyRouteStatus,
  cancelScheduledEvent,
  createInvitee,
  getCalendlyConfig,
  listAvailableTimes,
} from '../lib/calendly/server'
import { bookSchema, cancelSchema, resolveAvailabilityRange } from '../lib/calendly/validation'

/** Cloudflare rate limiting binding (optional — see wrangler.toml). */
interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

interface Env {
  /** Comma-separated origins allowed to call this Worker. */
  ALLOWED_ORIGINS?: string
  BOOKING_RATE_LIMIT?: RateLimiter
}

type Headers = Record<string, string>

function corsHeaders(origin: string | null, env: Env): Headers | null {
  const allowed = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (!origin || !allowed.includes(origin)) return null

  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  }
}

function json(body: unknown, status: number, cors: Headers = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      ...cors,
    },
  })
}

async function handleBook(request: Request, env: Env, cors: Headers): Promise<Response> {
  // Bookings consume the Calendly plan quota, so cap attempts per visitor.
  if (env.BOOKING_RATE_LIMIT) {
    const key = request.headers.get('CF-Connecting-IP') ?? 'unknown'
    const { success } = await env.BOOKING_RATE_LIMIT.limit({ key })
    if (!success) {
      return json(
        { error: 'Too many booking attempts. Please wait a minute and try again.' },
        429,
        cors,
      )
    }
  }

  const body: unknown = await request.json().catch(() => null)
  const parsed = bookSchema.safeParse(body)
  if (!parsed.success) {
    return json({ error: 'Invalid booking details' }, 400, cors)
  }

  let phone: string | undefined
  try {
    phone = toE164Phone(parsed.data.phone) ?? undefined
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid phone number'
    return json({ error: message }, 400, cors)
  }

  const booking = await createInvitee({ ...parsed.data, phone })
  return json({ booking }, 200, cors)
}

async function handleCancel(request: Request, cors: Headers): Promise<Response> {
  const body: unknown = await request.json().catch(() => null)
  const parsed = cancelSchema.safeParse(body)
  if (!parsed.success) {
    const detail = parsed.error.issues[0]?.message ?? 'Invalid cancel request'
    return json({ error: detail }, 400, cors)
  }

  await cancelScheduledEvent(parsed.data.eventUri, parsed.data.reason)
  return json({ ok: true }, 200, cors)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request.headers.get('Origin'), env)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors ?? {} })
    }

    // The booking widget is the only intended caller, so an unrecognised
    // Origin means the request did not come from our site.
    if (!cors) {
      return json({ error: 'Forbidden' }, 403)
    }

    if (!getCalendlyConfig()) {
      return json({ error: 'Calendly is not configured' }, 503, cors)
    }

    const { pathname, searchParams } = new URL(request.url)

    try {
      if (pathname === '/api/calendly/availability' && request.method === 'GET') {
        const range = resolveAvailabilityRange(searchParams.get('start'), searchParams.get('end'))
        if (!range) {
          return json({ error: 'Invalid date range' }, 400, cors)
        }
        return json({ slots: await listAvailableTimes(range) }, 200, cors)
      }

      if (pathname === '/api/calendly/book' && request.method === 'POST') {
        return await handleBook(request, env, cors)
      }

      if (pathname === '/api/calendly/cancel' && request.method === 'POST') {
        return await handleCancel(request, cors)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Calendly request failed'
      return json({ error: message }, calendlyRouteStatus(error), cors)
    }

    return json({ error: 'Not found' }, 404, cors)
  },
}
