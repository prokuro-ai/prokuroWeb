import type { NextRequest } from 'next/server'
import { proxyAuthorizedRequest } from '@/lib/server/proxyAuth'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string; erp: string }> },
) {
  const { accountId, erp } = await params
  return proxyAuthorizedRequest(
    req,
    `/v1/accounts/${encodeURIComponent(accountId)}/erp/mappings/${encodeURIComponent(erp)}`,
    {
      method: 'PUT',
      body: await req.text(),
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string; erp: string }> },
) {
  const { accountId, erp } = await params
  return proxyAuthorizedRequest(
    req,
    `/v1/accounts/${encodeURIComponent(accountId)}/erp/mappings/${encodeURIComponent(erp)}`,
    { method: 'DELETE' },
  )
}
