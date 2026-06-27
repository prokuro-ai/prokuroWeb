/** Server-side gateway URL for API route proxies (Amplify SSR / local dev). */
export function getGatewayBaseUrl(): string | null {
  const url = process.env.GATEWAY_URL?.trim().replace(/\/$/, '')
  return url || null
}

export function gatewayProxyUrl(path: string): string | null {
  const base = getGatewayBaseUrl()
  if (!base) return null
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
