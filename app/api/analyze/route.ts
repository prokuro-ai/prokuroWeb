import { type NextRequest } from 'next/server'
import { proxyFileUpload } from '@/lib/server/proxyUpload'

export async function POST(req: NextRequest) {
  return proxyFileUpload(req, '/v1/analyze')
}
