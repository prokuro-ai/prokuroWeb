import type { NextRequest } from 'next/server'
import { proxyAuthorizedRequest } from '@/lib/server/proxyAuth'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return proxyAuthorizedRequest(req, `/v1/team/invites/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
