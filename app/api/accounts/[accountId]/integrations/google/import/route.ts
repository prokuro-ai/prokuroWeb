import type { NextRequest } from 'next/server'
import { proxyAuthorizedRequest } from '@/lib/server/proxyAuth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> },
) {
  const { accountId } = await params
  const body = await req.text()
  return proxyAuthorizedRequest(
    req,
    `/v1/accounts/${encodeURIComponent(accountId)}/integrations/google/import`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    },
  )
}
