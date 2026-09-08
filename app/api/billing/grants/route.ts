import type { NextRequest } from 'next/server'
import { proxyAuthorizedRequest } from '@/lib/server/proxyAuth'

export async function POST(req: NextRequest) {
  const body = await req.text()
  return proxyAuthorizedRequest(req, '/v1/billing/grants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}

export async function DELETE(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email') ?? ''
  const search = email ? `?email=${encodeURIComponent(email)}` : ''
  return proxyAuthorizedRequest(req, `/v1/billing/grants${search}`, { method: 'DELETE' })
}
