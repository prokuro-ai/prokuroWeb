/**
 * Normalize a visitor-entered phone into E.164 for Calendly's
 * invitee.text_reminder_number (optional SMS reminder field).
 * Returns null when empty; throws when non-empty but invalid.
 */
export function toE164Phone(raw: string | undefined): string | null {
  const trimmed = raw?.trim()
  if (!trimmed) return null

  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 8 || digits.length > 15) {
    throw new Error('Enter a valid phone number, or leave it blank')
  }

  if (hasPlus) return `+${digits}`

  // Bare 10-digit US numbers → +1XXXXXXXXXX
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`

  throw new Error('Include a country code (e.g. +1 415 555 1234), or leave it blank')
}
