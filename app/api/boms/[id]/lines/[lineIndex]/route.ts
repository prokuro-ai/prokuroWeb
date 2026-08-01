import type { NextRequest } from 'next/server'
import { proxyAuthorizedRequest } from '@/lib/server/proxyAuth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lineIndex: string }> },
) {
  const { id, lineIndex } = await params
  const body = await req.text()
  return proxyAuthorizedRequest(
    req,
    `/v1/boms/${encodeURIComponent(id)}/lines/${encodeURIComponent(lineIndex)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    },
  )
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lineIndex: string }> },
) {
  const { id, lineIndex } = await params
  // version query string is forwarded by proxyAuthorizedRequest via req.nextUrl.search
  return proxyAuthorizedRequest(
    req,
    `/v1/boms/${encodeURIComponent(id)}/lines/${encodeURIComponent(lineIndex)}`,
    { method: 'DELETE' },
  )
}
