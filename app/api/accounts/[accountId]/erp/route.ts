import type { NextRequest } from 'next/server'
import { proxyAuthorizedRequest } from '@/lib/server/proxyAuth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> },
) {
  const { accountId } = await params
  return proxyAuthorizedRequest(req, `/v1/accounts/${encodeURIComponent(accountId)}/erp`)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> },
) {
  const { accountId } = await params
  return proxyAuthorizedRequest(req, `/v1/accounts/${encodeURIComponent(accountId)}/erp`, {
    method: 'PATCH',
    body: await req.text(),
    headers: { 'Content-Type': 'application/json' },
  })
}
