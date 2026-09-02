import { SELF_SERVE_ENABLED } from '@/lib/access'

export const SALES_EMAIL = 'sales@prokuro.ai'
export const SALES_MAILTO = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent('Prokuro demo request')}`

/** Primary marketing CTA: native demo booking via Calendly API. */
export const SCHEDULE_DEMO_PATH = '/schedule'
export const BOOK_DEMO_LABEL = 'Book a demo'

/**
 * Product origin for marketing deep-links (signup/pricing).
 * The raw Amplify host must not be exposed on the public prokuro.ai site, so the
 * default is empty and every product deep-link falls back to demo booking.
 * Set NEXT_PUBLIC_APP_ORIGIN=https://app.prokuro.ai to re-enable them.
 */
// export const APP_ORIGIN_FALLBACK = 'https://main.d1pxsiz7gqk923.amplifyapp.com'
export const APP_ORIGIN = (process.env.NEXT_PUBLIC_APP_ORIGIN?.trim() || '').replace(/\/$/, '')

/** False on the public marketing build: hide login/signup CTAs instead of linking out. */
export const APP_LINKS_ENABLED = APP_ORIGIN.length > 0

/** True when login/signup CTAs are safe to render (SSR app, or branded app origin set). */
export const PRODUCT_CTA_ENABLED = SELF_SERVE_ENABLED || APP_LINKS_ENABLED

export const APP_SIGNUP_URL = APP_LINKS_ENABLED ? `${APP_ORIGIN}/signup` : SCHEDULE_DEMO_PATH
export const APP_LOGIN_URL = APP_LINKS_ENABLED ? `${APP_ORIGIN}/login` : SCHEDULE_DEMO_PATH
export const APP_PRICING_URL = APP_LINKS_ENABLED ? `${APP_ORIGIN}/pricing` : SCHEDULE_DEMO_PATH
export const APP_DASHBOARD_URL = APP_LINKS_ENABLED ? `${APP_ORIGIN}/dashboard` : SCHEDULE_DEMO_PATH
