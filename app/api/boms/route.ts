import type { NextRequest } from 'next/server'
import { proxyAuthorizedMultipart, proxyAuthorizedRequest } from '@/lib/server/proxyAuth'

export async function GET(req: NextRequest) {
  return proxyAuthorizedRequest(req, '/v1/boms')
}

export async function POST(req: NextRequest) {
  return proxyAuthorizedMultipart(req, '/v1/boms')
}
