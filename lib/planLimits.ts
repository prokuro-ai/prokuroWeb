/** v1.1 plan limits — mirror of gateway entitlements. */

export type PlanId = 'free' | 'growth' | 'scale'

export type PlanLimits = {
  seats: number
  activeBoms: number
  maxLinesPerBom: number
  linesPerMonth: number
  analysesPerMonth: number
  purchasingActionsPerMonth: number
  ordersPerMonth: number
  refresh: 'weekly' | 'daily'
  bedrock: string
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    seats: 1,
    activeBoms: 1,
    maxLinesPerBom: 100,
    linesPerMonth: 300,
    analysesPerMonth: 3,
    purchasingActionsPerMonth: 5,
    ordersPerMonth: 2,
    refresh: 'weekly',
    bedrock: 'haiku_capped',
  },
  growth: {
    seats: 2,
    activeBoms: 10,
    maxLinesPerBom: 500,
    linesPerMonth: 2500,
    analysesPerMonth: 20,
    purchasingActionsPerMonth: 40,
    ordersPerMonth: 10,
    refresh: 'daily',
    bedrock: 'on',
  },
  scale: {
    seats: 5,
    activeBoms: 50,
    maxLinesPerBom: 2000,
    linesPerMonth: 15000,
    analysesPerMonth: 100,
    purchasingActionsPerMonth: 200,
    ordersPerMonth: 50,
    refresh: 'daily',
    bedrock: 'on',
  },
}

export function planLabel(plan: PlanId): string {
  if (plan === 'scale') return 'Scale'
  if (plan === 'growth') return 'Growth'
  return 'Free'
}

export function limitsFor(plan: PlanId | null | undefined): PlanLimits {
  return PLAN_LIMITS[plan ?? 'free']
}
