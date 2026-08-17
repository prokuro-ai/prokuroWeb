import { PLAN_LIMITS, type PlanId } from '@/lib/planLimits'

export type PublicPlan = {
  id: PlanId
  name: string
  price: string
  period: string
  blurb: string
  features: string[]
  cta: string
  highlighted: boolean
}

export const PUBLIC_PLANS: PublicPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '',
    blurb: 'Run one board through the analyst. Weekly refresh, small purchase pool.',
    features: [
      `${PLAN_LIMITS.free.activeBoms} active BOM · ${PLAN_LIMITS.free.maxLinesPerBom} lines`,
      `${PLAN_LIMITS.free.analysesPerMonth} analyses / mo`,
      'Weekly availability refresh',
      `${PLAN_LIMITS.free.purchasingActionsPerMonth} purchasing actions / mo`,
      'Lighter Bedrock (Haiku, capped)',
    ],
    cta: 'Start free',
    highlighted: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$149',
    period: '/mo',
    blurb: 'For buyers with a handful of live boards who need daily monitoring.',
    features: [
      `${PLAN_LIMITS.growth.activeBoms} active BOMs · ${PLAN_LIMITS.growth.maxLinesPerBom} lines`,
      `${PLAN_LIMITS.growth.analysesPerMonth} analyses / mo`,
      'Daily Digi-Key refresh + Bedrock analyst',
      `${PLAN_LIMITS.growth.purchasingActionsPerMonth} purchasing actions / mo`,
      'Email support',
    ],
    cta: 'Start Growth',
    highlighted: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: '$399',
    period: '/mo',
    blurb: 'For a small procurement pod living in Prokuro.',
    features: [
      `${PLAN_LIMITS.scale.activeBoms} active BOMs · ${PLAN_LIMITS.scale.maxLinesPerBom} lines`,
      `${PLAN_LIMITS.scale.analysesPerMonth} analyses / mo`,
      'Daily refresh + fuller agent headroom',
      `${PLAN_LIMITS.scale.purchasingActionsPerMonth} purchasing actions / mo`,
      'Priority support · Enterprise on request',
    ],
    cta: 'Start Scale',
    highlighted: false,
  },
]
