import type { BillingAccountStatus, BillingStatus, PlanSource } from '@/lib/api'
import { planLabel as shortPlanLabel } from '@/lib/planLimits'

export function planTitle(plan: BillingAccountStatus['plan'] | undefined) {
  return plan ? `${shortPlanLabel(plan)} Plan` : 'Billing unavailable'
}

export function billingStatusLabel(status: BillingStatus | undefined, planSource?: PlanSource) {
  if (planSource === 'admin') return 'Admin-assigned'
  switch (status) {
    case 'active':
      return 'Active'
    case 'trialing':
      return 'Trial'
    case 'past_due':
      return 'Past due'
    case 'canceled':
      return 'Canceled'
    case 'none':
    default:
      return 'No subscription'
  }
}

export function formatPeriodEnd(value: string | null | undefined) {
  if (!value) return null
  const asNumber = Number(value)
  const date = Number.isFinite(asNumber) && value.trim() !== ''
    ? new Date(asNumber * 1000)
    : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function bedrockLabel(value: string | undefined) {
  if (!value) return '—'
  if (value === 'haiku_capped') return 'Capped Haiku'
  if (value === 'on') return 'Full analyst'
  return value.replace(/_/g, ' ')
}

export function refreshLabel(value: string | undefined) {
  if (value === 'daily') return 'Daily'
  if (value === 'weekly') return 'Weekly'
  return value ?? '—'
}

export function formatCap(value: number | null | undefined) {
  return value == null ? '—' : value.toLocaleString()
}
