import { NextResponse, type NextRequest } from 'next/server'
import { toE164Phone } from '@/lib/calendly/phone'
import { calendlyRouteStatus, createInvitee, getCalendlyConfig } from '@/lib/calendly/server'
import { bookSchema } from '@/lib/calendly/validation'

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

  const parsed = bookSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid booking details' }, { status: 400 })
  }

  let phone: string | undefined
  try {
    phone = toE164Phone(parsed.data.phone) ?? undefined
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid phone number'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    const booking = await createInvitee({ ...parsed.data, phone })
    return NextResponse.json({ booking })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create booking'
    return NextResponse.json({ error: message }, { status: calendlyRouteStatus(error) })
  }
}
