import { type NextRequest, NextResponse } from 'next/server'
import { gatewayProxyUrl } from './gateway'

export async function proxyFileUpload(req: NextRequest, upstreamPath: string): Promise<NextResponse> {
  const targetUrl = gatewayProxyUrl(upstreamPath)
  if (!targetUrl) {
    return NextResponse.json(
      { error: 'Backend is not configured (GATEWAY_URL is missing)' },
      { status: 503 },
    )
  }

  const form = await req.formData()
  const file = form.get('file')
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: "missing 'file' field" }, { status: 422 })
  }

  const outbound = new FormData()
  outbound.append('file', file, file instanceof File ? file.name : 'upload.csv')

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      body: outbound,
    })
    const body = await res.text()
    return new NextResponse(body, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error(`Gateway proxy failed (${upstreamPath}) -> ${targetUrl}:`, detail)
    return NextResponse.json({ error: 'Could not reach backend service' }, { status: 502 })
  }
}
