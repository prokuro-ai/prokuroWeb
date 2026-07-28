/**
 * Public origin of the Cloudflare Worker that fronts Calendly for static
 * builds (worker/index.ts). Deployed with `npm run worker:deploy`.
 *
 * This is committed rather than supplied as a build-time variable because it is
 * already public — it ships inside the client bundle — and because a missing
 * variable previously published a booking page that silently never loaded any
 * times.
 */
export const CALENDLY_WORKER_ORIGIN = 'https://prokuro-calendly.mounir-d96.workers.dev'

/**
 * Origin to prefix onto /api/calendly/* requests.
 * Empty means same-origin, i.e. the Next.js routes handle it (local dev, SSR).
 */
export function calendlyApiBase(): string {
  const override = process.env.NEXT_PUBLIC_CALENDLY_API_BASE?.trim()
  if (override) return override.replace(/\/+$/, '')

  // NEXT_PUBLIC_ prefix so this also resolves inside the browser bundle;
  // scripts/build-pages.mjs sets it for static exports only.
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === '1') return CALENDLY_WORKER_ORIGIN

  return ''
}
