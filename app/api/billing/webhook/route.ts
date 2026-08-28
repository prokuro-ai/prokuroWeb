import { NextRequest, NextResponse } from 'next/server'
import { gatewayProxyUrl } from '@/lib/server/gateway'

/**
 * HTTPS Stripe webhook ingress via Amplify.
 * Forwards the raw body + Stripe-Signature to the gateway (HTTP ALB).
 * Use https://app.prokuro.ai/api/billing/webhook in the Stripe Dashboard.
 */
export async function POST(req: NextRequest) {
  const target = gatewayProxyUrl('/v1/billing/webhook')
  if (!target) {
    return NextResponse.json(
      { error: 'Backend is not configured (GATEWAY_URL is missing)' },
      { status: 503 },
    )
  }

  const body = await req.arrayBuffer()
  const signature = req.headers.get('stripe-signature')
  const headers: HeadersInit = {
    'content-type': req.headers.get('content-type') || 'application/json',
  }
  if (signature) {
    headers['stripe-signature'] = signature
  }

  try {
    const upstream = await fetch(target, {
      method: 'POST',
      headers,
      body,
      cache: 'no-store',
    })
    const responseBody = await upstream.arrayBuffer()
    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'application/json',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'webhook proxy failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
