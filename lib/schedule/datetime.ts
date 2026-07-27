import { format } from 'date-fns'

/** Stable per-day key in the visitor's local timezone. */
export function dayKey(date: Date | string): string {
  return format(typeof date === 'string' ? new Date(date) : date, 'yyyy-MM-dd')
}

export function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

/** e.g. "Los Angeles (PDT)" */
export function timeZoneLabel(timeZone: string): string {
  const city = timeZone.split('/').pop()?.replace(/_/g, ' ') ?? timeZone
  const short = new Intl.DateTimeFormat(undefined, { timeZone, timeZoneName: 'short' })
    .formatToParts(new Date())
    .find((part) => part.type === 'timeZoneName')?.value

  return short ? `${city} (${short})` : city
}

export function formatTime(iso: string): string {
  return format(new Date(iso), 'h:mm a')
}

export function formatDayLong(date: Date): string {
  return format(date, 'EEEE, MMMM d')
}

export function formatConfirmation(iso: string): string {
  return format(new Date(iso), "EEEE, MMMM d 'at' h:mm a")
}
