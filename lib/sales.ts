export const SALES_EMAIL = 'sales@prokuro.ai'
export const SALES_MAILTO = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent('Prokuro demo request')}`

/** Primary marketing CTA: native demo booking via Calendly API. */
export const SCHEDULE_DEMO_PATH = '/schedule'
export const BOOK_DEMO_LABEL = 'Book a demo'

/**
 * Product origin (Amplify). GitHub Pages links here for self-serve signup/pricing
 * because static export cannot host Cognito/API routes.
 */
export const APP_ORIGIN = (
  process.env.NEXT_PUBLIC_APP_ORIGIN?.trim() || 'https://app.prokuro.ai'
).replace(/\/$/, '')

export const APP_SIGNUP_URL = `${APP_ORIGIN}/signup`
export const APP_LOGIN_URL = `${APP_ORIGIN}/login`
export const APP_PRICING_URL = `${APP_ORIGIN}/pricing`
export const APP_DASHBOARD_URL = `${APP_ORIGIN}/dashboard`
