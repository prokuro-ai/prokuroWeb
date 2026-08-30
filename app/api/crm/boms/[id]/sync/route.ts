import type { NextRequest } from 'next/server'
import { proxyAuthorizedRequest } from '@/lib/server/proxyAuth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.text()
  return proxyAuthorizedRequest(req, `/v1/crm/boms/${encodeURIComponent(id)}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}
