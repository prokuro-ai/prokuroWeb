'use client'

import { AppModal, ModalNotice } from '@/components/AppModal'
import { appGhostBtn, appPrimaryBtn } from '@/components/app/chrome'
import { PUBLIC_PLANS, type PublicPlan } from '@/lib/publicPlans'
import { PLAN_LIMITS, type PlanId } from '@/lib/planLimits'

function planFacts(plan: PublicPlan): string[] {
  if (plan.id === 'enterprise') {
    return ['Custom BOMs and seats', 'SSO and onboarding', 'Dedicated support']
  }
  const limits = PLAN_LIMITS[plan.id]
  return [
    `${limits.activeBoms} BOM${limits.activeBoms === 1 ? '' : 's'}`,
    limits.refresh === 'daily' ? 'Daily refresh' : 'Weekly refresh',
    `${limits.seats} ${limits.seats === 1 ? 'person' : 'people'}`,
  ]
}

type PricingModalProps = {
  open: boolean
  onClose: () => void
  currentPlan?: PlanId | null
  busy?: boolean
  error?: string | null
  onSelect: (plan: PublicPlan) => void
}

export function PricingModal({
  open,
  onClose,
  currentPlan,
  busy = false,
  error,
  onSelect,
}: PricingModalProps) {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      eyebrow="Plans"
      title="Choose a plan"
      maxWidth="xl"
      closeDisabled={busy}
    >
      {error ? <ModalNotice tone="error">{error}</ModalNotice> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {PUBLIC_PLANS.map((plan) => {
          const current = plan.id === currentPlan
          const facts = planFacts(plan)
          const selectable = !busy && !current

          return (
            <article
              key={plan.id}
              className={`flex flex-col rounded-[8px] bg-mk-raised p-5 text-left transition-colors duration-150 ${
                selectable ? 'cursor-pointer hover:bg-mk-canvas hover:shadow-[var(--mk-shadow)]' : ''
              } ${plan.highlighted && !current ? 'ring-1 ring-inset ring-mk-accent' : ''}`}
              onClick={selectable ? () => onSelect(plan) : undefined}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13px] font-semibold text-mk-ink">{plan.name}</p>
                {current ? (
                  <span className="text-[12px] text-mk-ink-subtle">Current</span>
                ) : plan.highlighted ? (
                  <span className="text-[12px] text-mk-accent">Popular</span>
                ) : null}
              </div>
              <p className="mk-app-title mt-2 text-mk-ink">
                {plan.price}
                {plan.period ? (
                  <span className="ml-1 font-mk-sans text-[13px] font-normal tracking-normal text-mk-ink-subtle">
                    {plan.period}
                  </span>
                ) : null}
              </p>
              <p className="mt-2 text-[13px] leading-5 text-mk-ink-muted">{plan.blurb}</p>
              <ul className="mt-4 flex-1 space-y-1.5 text-[13px] text-mk-ink">
                {facts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
              <button
                type="button"
                disabled={busy || current}
                onClick={(event) => {
                  event.stopPropagation()
                  onSelect(plan)
                }}
                className={`mt-5 w-full ${current ? appGhostBtn : plan.highlighted ? appPrimaryBtn : appGhostBtn}`}
              >
                {current ? 'Current plan' : busy ? 'Opening…' : plan.cta}
              </button>
            </article>
          )
        })}
      </div>
    </AppModal>
  )
}
