import type { NextRequest } from 'next/server'
import { proxyAuthorizedRedirect } from '@/lib/server/proxyAuth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> },
) {
  const { accountId } = await params
  return proxyAuthorizedRedirect(
    req,
    `/v1/accounts/${encodeURIComponent(accountId)}/integrations/google/start`,
  )
}
