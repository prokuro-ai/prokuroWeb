export const SALES_EMAIL = 'sales@prokuro.ai'
export const SALES_MAILTO = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent('Prokuro demo request')}`

/** Primary marketing CTA: native demo booking via Calendly API. */
export const SCHEDULE_DEMO_PATH = '/schedule'
export const BOOK_DEMO_LABEL = 'Book a demo'

/**
 * Product origin for marketing deep-links (signup/pricing).
 * Prefer Amplify default while app.prokuro.ai Amplify association is FAILED.
 * Override with NEXT_PUBLIC_APP_ORIGIN=https://app.prokuro.ai once AVAILABLE.
 */
export const APP_ORIGIN = (
  process.env.NEXT_PUBLIC_APP_ORIGIN?.trim() ||
  'https://main.d1pxsiz7gqk923.amplifyapp.com'
).replace(/\/$/, '')

export const APP_SIGNUP_URL = `${APP_ORIGIN}/signup`
export const APP_LOGIN_URL = `${APP_ORIGIN}/login`
export const APP_PRICING_URL = `${APP_ORIGIN}/pricing`
export const APP_DASHBOARD_URL = `${APP_ORIGIN}/dashboard`
