import { type NextRequest, NextResponse } from 'next/server'

function parseServiceBase(): string {
  const gateway = process.env.GATEWAY_URL?.replace(/\/$/, '')
  if (gateway) return gateway
  return (process.env.PARSER_URL ?? 'http://localhost:3001').replace(/\/$/, '')
}

export async function POST(req: NextRequest) {
  const form = await req.formData()

  try {
    const res = await fetch(`${parseServiceBase()}/v1/parse`, {
      method: 'POST',
      body: form,
    })
    const body = await res.text()
    return new NextResponse(body, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return NextResponse.json({ error: 'Could not reach parser service' }, { status: 502 })
  }
}
