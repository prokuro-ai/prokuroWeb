import type { PurchaseProviderId, PurchaseStatus } from '@/lib/types'

export const PROVIDER_LABEL: Record<PurchaseProviderId, string> = {
  digikey: 'Digi-Key',
  mouser: 'Mouser',
}

export function statusLabel(status: PurchaseStatus): string {
  switch (status) {
    case 'quoted':
      return 'Quoted'
    case 'partial':
      return 'Partial quote'
    case 'unavailable':
      return 'Unavailable'
    case 'submitted':
      return 'Order submitted'
    case 'not_configured':
      return 'Distributor not connected yet'
    case 'requires_distributor_credit':
      return 'Distributor credit required'
    case 'requires_subscription':
      return 'Paid plan required'
    case 'cap_exceeded':
      return 'This month’s buy limit is used up'
    case 'error':
      return 'Could not reach the distributor'
  }
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
