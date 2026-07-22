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

    // Gateway DELETE returns 204 No Content. RFC 7230 forbids a body and Content-Type
    // on 204; forwarding "" with application/json makes Amplify return 502 to the client
    // even though the upstream delete already succeeded.
    if (res.status === 204 || res.status === 205) {
      return new NextResponse(null, { status: res.status })
    }

    const body = await res.text()
    const contentType = res.headers.get('Content-Type')
    const responseHeaders = new Headers()
    if (contentType) {
      responseHeaders.set('Content-Type', contentType)
    } else if (body) {
      responseHeaders.set('Content-Type', 'application/json')
    }

    return new NextResponse(body || null, {
      status: res.status,
      headers: responseHeaders,
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
    if (res.status === 204 || res.status === 205) {
      return new NextResponse(null, { status: res.status })
    }

    const responseBody = await res.text()
    const responseContentType = res.headers.get('Content-Type')
    const responseHeaders = new Headers()
    if (responseContentType) {
      responseHeaders.set('Content-Type', responseContentType)
    } else if (responseBody) {
      responseHeaders.set('Content-Type', 'application/json')
    }

    return new NextResponse(responseBody || null, {
      status: res.status,
      headers: responseHeaders,
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error(`Gateway proxy failed (${upstreamPath}) -> ${targetUrl}:`, detail)
    return NextResponse.json({ error: 'Could not reach backend service' }, { status: 502 })
  }
}
