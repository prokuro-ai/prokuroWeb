import type { NextRequest } from 'next/server'
import { proxyAuthorizedRequest } from '@/lib/server/proxyAuth'

export async function GET(req: NextRequest) {
  return proxyAuthorizedRequest(req, '/v1/team/members')
}
