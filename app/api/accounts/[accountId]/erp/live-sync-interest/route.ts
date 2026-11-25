import type { NextRequest } from 'next/server'
import { proxyAuthorizedRequest } from '@/lib/server/proxyAuth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> },
) {
  const { accountId } = await params
  return proxyAuthorizedRequest(
    req,
    `/v1/accounts/${encodeURIComponent(accountId)}/erp/live-sync-interest`,
    {
      method: 'POST',
      body: await req.text(),
      headers: { 'Content-Type': 'application/json' },
    },
  )
}
