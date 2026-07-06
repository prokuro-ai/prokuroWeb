import type { NextRequest } from 'next/server'
import { proxyAuthorizedRequest } from '@/lib/server/proxyAuth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return proxyAuthorizedRequest(req, `/v1/boms/${encodeURIComponent(id)}`)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return proxyAuthorizedRequest(req, `/v1/boms/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
