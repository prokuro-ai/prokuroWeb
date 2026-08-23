/**
 * When false, signup/login and the app are hidden; marketing only (Book a demo).
 * Flip to true when Bedrock/product is ready for public self-serve.
 */
export const SELF_SERVE_ENABLED = false

/** App routes blocked while self-serve is disabled. */
export const APP_ROUTE_PREFIXES = [
  '/dashboard',
  '/boms',
  '/purchasing',
  '/account',
  '/invite',
  '/bom',
  '/analyze',
  '/auth',
] as const

export const AUTH_ROUTE_PREFIXES = ['/login', '/signup'] as const

export function isBlockedRoute(pathname: string): boolean {
  if (SELF_SERVE_ENABLED) return false
  return (
    AUTH_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
    APP_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  )
}
