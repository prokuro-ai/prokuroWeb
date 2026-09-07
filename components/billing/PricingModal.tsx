'use client'

import { Check } from 'lucide-react'
import { AppModal, ModalNotice } from '@/components/AppModal'
import { appGhostBtn, appPrimaryBtn } from '@/components/app/chrome'
import { PUBLIC_PLANS, type PublicPlan } from '@/lib/publicPlans'
import { PLAN_LIMITS, planLabel, type PlanId } from '@/lib/planLimits'
import { bedrockLabel, refreshLabel } from '@/lib/billing-display'

const COMPARE_ROWS: { label: string; value: (plan: PlanId) => string }[] = [
  { label: 'People who can join', value: (plan) => String(PLAN_LIMITS[plan].seats) },
  { label: 'BOMs on file', value: (plan) => String(PLAN_LIMITS[plan].activeBoms) },
  { label: 'Max parts / BOM', value: (plan) => PLAN_LIMITS[plan].maxLinesPerBom.toLocaleString() },
  { label: 'Parts screened / month', value: (plan) => PLAN_LIMITS[plan].linesPerMonth.toLocaleString() },
  { label: 'BOM uploads / month', value: (plan) => String(PLAN_LIMITS[plan].analysesPerMonth) },
  {
    label: 'Quotes / month',
    value: (plan) => String(PLAN_LIMITS[plan].purchasingActionsPerMonth),
  },
  { label: 'Orders / month', value: (plan) => String(PLAN_LIMITS[plan].ordersPerMonth) },
  { label: 'BOM refresh', value: (plan) => refreshLabel(PLAN_LIMITS[plan].refresh) },
  { label: 'Line briefs', value: (plan) => bedrockLabel(PLAN_LIMITS[plan].bedrock) },
]

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
      title="Choose the capacity you need"
      subtitle="Checkout is live through Stripe. The table below is the published catalog — live meters stay on this page."
      maxWidth="2xl"
      closeDisabled={busy}
    >
      {error ? <ModalNotice tone="error">{error}</ModalNotice> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PUBLIC_PLANS.map((plan) => {
          const current = plan.id === currentPlan
          return (
            <article
              key={plan.id}
              className={`flex flex-col rounded-[8px] bg-mk-raised p-5 ${
                plan.highlighted ? 'ring-1 ring-inset ring-mk-accent' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-semibold text-mk-ink">{plan.name}</p>
                {current ? (
                  <span className="mk-eyebrow text-mk-accent">Current</span>
                ) : plan.highlighted ? (
                  <span className="mk-eyebrow text-mk-accent">Popular</span>
                ) : null}
              </div>
              <p className="mk-app-title mt-3 text-mk-ink">
                {plan.price}
                {plan.period ? (
                  <span className="ml-1 font-mk-sans text-[13px] font-normal tracking-normal text-mk-ink-subtle">
                    {plan.period}
                  </span>
                ) : null}
              </p>
              <p className="mt-3 text-[12px] leading-5 text-mk-ink-muted">{plan.blurb}</p>
              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-[12px] text-mk-ink-muted">
                    <Check size={13} className="mt-0.5 shrink-0 text-mk-accent" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={busy || current}
                onClick={() => onSelect(plan)}
                className={`mt-5 w-full ${current ? appGhostBtn : plan.highlighted ? appPrimaryBtn : appGhostBtn}`}
              >
                {current ? 'Current plan' : busy ? 'Opening…' : plan.cta}
              </button>
            </article>
          )
        })}
      </div>

      <p className="mt-6 text-[11px] text-mk-ink-subtle">
        Comparison numbers are the published plan catalog, not this account&apos;s live usage.
      </p>
      <div className="mt-2 overflow-x-auto rounded-[8px] bg-mk-raised">
        <table className="w-full min-w-[640px] border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-mk-line">
              <th className="px-4 py-3 font-medium text-mk-ink-subtle">Capacity</th>
              {(['free', 'growth', 'scale'] as const).map((id) => (
                <th key={id} className="px-4 py-3 font-semibold text-mk-ink">
                  {planLabel(id)}
                  {id === currentPlan ? (
                    <span className="ml-2 mk-eyebrow text-mk-accent">You</span>
                  ) : null}
                </th>
              ))}
              <th className="px-4 py-3 font-semibold text-mk-ink">Enterprise</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row) => (
              <tr key={row.label} className="border-t border-mk-line">
                <td className="px-4 py-2.5 text-mk-ink-subtle">{row.label}</td>
                {(['free', 'growth', 'scale'] as const).map((id) => (
                  <td key={id} className="px-4 py-2.5 font-mk-mono tabular-nums text-mk-ink">
                    {row.value(id)}
                  </td>
                ))}
                <td className="px-4 py-2.5 text-mk-ink-subtle">Custom</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppModal>
  )
}
