/**
 * Display helpers for API date strings.
 *
 * The gateway now stores `uploadedAt` as ISO-8601. Older records used unix
 * seconds with a trailing `Z` (e.g. `1738765432Z`), which `Date` cannot parse.
 * Keep the legacy branch until existing BOMs are gone or migrated.
 */
export function parseUploadedAt(value: string): Date | null {
  const trimmed = value.trim()
  const unix = trimmed.match(/^(\d{9,})Z?$/i)
  if (unix) {
    const date = new Date(Number(unix[1]) * 1000)
    return Number.isNaN(date.getTime()) ? null : date
  }
  const date = new Date(trimmed)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatUploadedAt(value: string): string {
  const date = parseUploadedAt(value)
  if (!date) return '—'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
