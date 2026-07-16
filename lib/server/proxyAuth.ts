import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { gatewayProxyUrl } from '@/lib/server/gateway'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function missingGateway() {
  return NextResponse.json({ error: 'Backend is not configured (GATEWAY_URL is missing)' }, { status: 503 })
}

export async function proxyAuthorizedRequest(
  req: NextRequest,
  upstreamPath: string,
  init: RequestInit = {},
): Promise<NextResponse> {
  const search = req.nextUrl.search
  const targetUrl = gatewayProxyUrl(`${upstreamPath}${search}`)
  if (!targetUrl) return missingGateway()

  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return unauthorized()

  const headers = new Headers(init.headers)
  headers.set('Authorization', auth)

  try {
    const res = await fetch(targetUrl, { ...init, headers })
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

export async function proxyAuthorizedMultipart(
  req: NextRequest,
  upstreamPath: string,
): Promise<NextResponse> {
  const targetUrl = gatewayProxyUrl(upstreamPath)
  if (!targetUrl) return missingGateway()

  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return unauthorized()

  const contentType = req.headers.get('content-type')
  const body = await req.arrayBuffer()

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        Authorization: auth,
        ...(contentType ? { 'Content-Type': contentType } : {}),
      },
      body,
    })
    const responseBody = await res.text()
    return new NextResponse(responseBody, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error(`Gateway proxy failed (${upstreamPath}) -> ${targetUrl}:`, detail)
    return NextResponse.json({ error: 'Could not reach backend service' }, { status: 502 })
  }
}
