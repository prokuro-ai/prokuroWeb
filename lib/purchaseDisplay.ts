import type { PurchaseProviderId, PurchaseStatus } from '@/lib/types'

/**
 * Buyers never pick a distributor. Until the gateway prices every distributor and keeps the
 * cheapest per line, all sourcing calls go to this one.
 */
export const SOURCING_PROVIDER: PurchaseProviderId = 'digikey'

export function statusLabel(status: PurchaseStatus): string {
  switch (status) {
    case 'quoted':
      return 'Priced'
    case 'partial':
      return 'Some parts priced'
    case 'unavailable':
      return 'No prices found'
    case 'submitted':
      return 'Order placed'
    case 'not_configured':
    case 'requires_distributor_credit':
      return 'Ordering isn’t switched on for your account yet'
    case 'requires_subscription':
      return 'Paid plan required'
    case 'cap_exceeded':
      return 'This month’s sourcing limit is used up'
    case 'error':
      return 'Pricing is unavailable right now'
  }
}

/** Gateway messages can name the distributor; only plan messages are worth showing a buyer. */
export function buyerMessage(status: PurchaseStatus, message?: string | null): string | null {
  if (!message?.trim()) return null
  return status === 'cap_exceeded' || status === 'requires_subscription' ? message.trim() : null
}

export function money(value: number | null | undefined, currency?: string | null): string {
  if (value == null) return '—'
  const code = currency ?? 'USD'
  try {
    // Passive unit prices are fractions of a cent; two decimals would print $0.00.
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: Math.abs(value) < 1 ? 4 : 2,
    }).format(value)
  } catch {
    return `${value.toFixed(4)} ${code}`
  }
}
