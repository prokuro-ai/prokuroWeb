import type { ShippingAddress } from '@/lib/types'

export const SHIP_TO_STORAGE_KEY = 'prokuro:buy-ship-to:v1'

export type ShipToDraft = {
  name: string
  company: string
  line1: string
  line2: string
  city: string
  region: string
  postal_code: string
  country: string
}

export const EMPTY_SHIP_TO: ShipToDraft = {
  name: '',
  company: '',
  line1: '',
  line2: '',
  city: '',
  region: '',
  postal_code: '',
  country: '',
}

export function parseStoredShipTo(raw: string | null): ShipToDraft {
  if (!raw) return { ...EMPTY_SHIP_TO }
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object') return { ...EMPTY_SHIP_TO }
    const obj = value as Record<string, unknown>
    const field = (key: keyof ShipToDraft) => (typeof obj[key] === 'string' ? obj[key] : '')
    return {
      name: field('name'),
      company: field('company'),
      line1: field('line1'),
      line2: field('line2'),
      city: field('city'),
      region: field('region'),
      postal_code: field('postal_code'),
      country: field('country'),
    }
  } catch {
    return { ...EMPTY_SHIP_TO }
  }
}

/** Omit when blank; if any field is set, require line1 / city / postal / country. */
export function shipToForOrder(draft: ShipToDraft): { address?: ShippingAddress; error?: string } {
  const trimmed: ShipToDraft = {
    name: draft.name.trim(),
    company: draft.company.trim(),
    line1: draft.line1.trim(),
    line2: draft.line2.trim(),
    city: draft.city.trim(),
    region: draft.region.trim(),
    postal_code: draft.postal_code.trim(),
    country: draft.country.trim(),
  }
  const anyFilled = Object.values(trimmed).some(Boolean)
  if (!anyFilled) return {}
  if (!trimmed.line1 || !trimmed.city || !trimmed.postal_code || !trimmed.country) {
    return { error: 'Ship-to needs street, city, postal code, and country — or clear the fields.' }
  }
  return {
    address: {
      line1: trimmed.line1,
      city: trimmed.city,
      postal_code: trimmed.postal_code,
      country: trimmed.country,
      ...(trimmed.name ? { name: trimmed.name } : {}),
      ...(trimmed.company ? { company: trimmed.company } : {}),
      ...(trimmed.line2 ? { line2: trimmed.line2 } : {}),
      ...(trimmed.region ? { region: trimmed.region } : {}),
    },
  }
}
