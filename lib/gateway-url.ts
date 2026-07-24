/** Client-side gateway base URL when set (bypasses Amplify's ~30s API route proxy timeout). */
export function getPublicGatewayBaseUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_GATEWAY_URL?.trim().replace(/\/$/, '')
  return url || null
}

export function publicGatewayUrl(path: string): string | null {
  const base = getPublicGatewayBaseUrl()
  if (!base) return null
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export function uploadEndpoint(kind: 'parse' | 'analyze'): string {
  const direct = publicGatewayUrl(kind === 'parse' ? '/v1/parse' : '/v1/analyze')
  if (direct) return direct
  return kind === 'parse' ? '/api/parse' : '/api/analyze'
}
