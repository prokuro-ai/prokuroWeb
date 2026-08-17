import type { NextRequest } from 'next/server'
import { proxyAuthorizedRequest } from '@/lib/server/proxyAuth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const body = await req.text()
  return proxyAuthorizedRequest(req, `/v1/team/members/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  return proxyAuthorizedRequest(req, `/v1/team/members/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  })
}
