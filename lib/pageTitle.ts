import type { Metadata } from 'next'

/** Must match `title.template` in `app/layout.tsx`. */
export const TITLE_SUFFIX = 'Prokuro AI'

export const PAGE = {
  home: 'Prokuro AI | Procurement Agents That Work Your BOM',
  login: 'Log in',
  signup: 'Create an account',
  schedule: 'Book a demo',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  notFound: 'Page not found',
  thisWeek: 'This week',
  boms: 'BOMs',
  buy: 'Buy',
  admin: 'Admin',
  settings: 'Settings',
  billing: 'Billing',
  invite: 'Accept invite',
  signingIn: 'Signing in',
  bom: 'BOM',
  bomMissing: 'BOM not found',
} as const

export function formatPageTitle(page: string): string {
  return `${page} | ${TITLE_SUFFIX}`
}

export function pageMetadata(page: string, extras: Omit<Metadata, 'title'> = {}): Metadata {
  return { title: page, ...extras }
}

export function normalizeAppPath(pathname: string | null | undefined): string {
  if (!pathname || pathname === '/') return '/'
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

/** Static title for a product path. `/bom/:id` stays `BOM` until the record loads. */
export function pageTitleForPath(pathname: string | null | undefined): string | null {
  const path = normalizeAppPath(pathname)
  if (path === '/dashboard') return PAGE.thisWeek
  if (path === '/boms' || path === '/bom/new' || path === '/analyze') return PAGE.boms
  if (path.startsWith('/bom/')) return PAGE.bom
  if (path === '/purchasing') return PAGE.buy
  if (path === '/admin') return PAGE.admin
  if (path === '/account') return PAGE.settings
  if (path === '/billing') return PAGE.billing
  if (path === '/login') return PAGE.login
  if (path === '/signup') return PAGE.signup
  if (path === '/schedule') return PAGE.schedule
  if (path === '/privacy') return PAGE.privacy
  if (path === '/terms') return PAGE.terms
  if (path === '/invite/accept') return PAGE.invite
  if (path === '/auth/callback') return PAGE.signingIn
  if (path === '/') return null
  return null
}
