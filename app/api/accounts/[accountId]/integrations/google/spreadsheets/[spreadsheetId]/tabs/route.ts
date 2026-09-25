import type { NextRequest } from 'next/server'
import { proxyAuthorizedRequest } from '@/lib/server/proxyAuth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string; spreadsheetId: string }> },
) {
  const { accountId, spreadsheetId } = await params
  return proxyAuthorizedRequest(
    req,
    `/v1/accounts/${encodeURIComponent(accountId)}/integrations/google/spreadsheets/${encodeURIComponent(spreadsheetId)}/tabs`,
  )
}
