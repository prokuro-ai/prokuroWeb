/**
 * Product login/dashboard is on Amplify SSR and local `next dev`.
 * GitHub Pages (`NEXT_PUBLIC_STATIC_EXPORT=1`) cannot host Cognito/API routes —
 * marketing CTAs deep-link to APP_ORIGIN (app.prokuro.ai) instead.
 */
export const SELF_SERVE_ENABLED = process.env.NEXT_PUBLIC_STATIC_EXPORT !== '1'

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
