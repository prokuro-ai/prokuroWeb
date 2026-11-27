import type { NextRequest } from 'next/server'
import { proxyAuthorizedRequest } from '@/lib/server/proxyAuth'

export async function GET(req: NextRequest) {
  return proxyAuthorizedRequest(req, '/v1/purchase/orders', {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  return proxyAuthorizedRequest(req, '/v1/purchase/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}
