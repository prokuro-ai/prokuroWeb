'use client'

import { Check } from 'lucide-react'
import { AppModal, ModalNotice } from '@/components/AppModal'
import { PUBLIC_PLANS, type PublicPlan } from '@/lib/publicPlans'
import { PLAN_LIMITS, planLabel, type PlanId } from '@/lib/planLimits'
import { SCHEDULE_DEMO_PATH } from '@/lib/sales'
import { bedrockLabel, refreshLabel } from '@/lib/billing-display'

const BLUE = '#0062ff'
const NAVY = '#0f1b2d'

const COMPARE_ROWS: { label: string; value: (plan: PlanId) => string }[] = [
  { label: 'Seats', value: (plan) => String(PLAN_LIMITS[plan].seats) },
  { label: 'Monitored BOMs', value: (plan) => String(PLAN_LIMITS[plan].activeBoms) },
  { label: 'Max lines / BOM', value: (plan) => PLAN_LIMITS[plan].maxLinesPerBom.toLocaleString() },
  { label: 'Lines / month', value: (plan) => PLAN_LIMITS[plan].linesPerMonth.toLocaleString() },
  { label: 'Analyses / month', value: (plan) => String(PLAN_LIMITS[plan].analysesPerMonth) },
  {
    label: 'Purchasing actions',
    value: (plan) => String(PLAN_LIMITS[plan].purchasingActionsPerMonth),
  },
  { label: 'Orders / month', value: (plan) => String(PLAN_LIMITS[plan].ordersPerMonth) },
  { label: 'Refresh', value: (plan) => refreshLabel(PLAN_LIMITS[plan].refresh) },
  { label: 'Analyst', value: (plan) => bedrockLabel(PLAN_LIMITS[plan].bedrock) },
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
      subtitle="Checkout is live through Stripe. The capacity table below is the published plan catalog — your actual meters stay on the billing page."
      maxWidth="2xl"
      closeDisabled={busy}
    >
      {error ? <ModalNotice tone="error">{error}</ModalNotice> : null}

      <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
        {PUBLIC_PLANS.map((plan) => {
          const current = plan.id === currentPlan
          return (
            <article
              key={plan.id}
              className={`flex flex-col bg-white p-5 ${
                plan.highlighted ? 'ring-1 ring-inset ring-[#0062ff]' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-semibold" style={{ color: NAVY }}>
                  {plan.name}
                </p>
                {current ? (
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#0062ff]">
                    Current
                  </span>
                ) : plan.highlighted ? (
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#0062ff]">
                    Popular
                  </span>
                ) : null}
              </div>
              <p className="mt-3 font-mono text-[28px] leading-none tracking-tight" style={{ color: NAVY }}>
                {plan.price}
                {plan.period ? (
                  <span className="text-[12px] text-slate-400">{plan.period}</span>
                ) : null}
              </p>
              <p className="mt-3 text-[12px] leading-5 text-slate-500">{plan.blurb}</p>
              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-[12px] text-slate-600">
                    <Check size={13} className="mt-0.5 shrink-0 text-[#0062ff]" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={busy || current}
                onClick={() => onSelect(plan)}
                className={`mt-5 w-full px-3 py-2 text-[12px] font-semibold disabled:opacity-50 ${
                  current
                    ? 'border border-slate-200 bg-slate-50 text-slate-400'
                    : plan.highlighted
                      ? 'text-white'
                      : 'border border-slate-200 text-slate-800 hover:bg-slate-50'
                }`}
                style={current || !plan.highlighted ? undefined : { background: BLUE }}
              >
                {current ? 'Current plan' : busy ? 'Opening…' : plan.cta}
              </button>
            </article>
          )
        })}
      </div>

      <p className="mt-6 text-[11px] text-slate-400">
        Comparison numbers are the published plan catalog, not this account&apos;s live usage.
      </p>
      <div className="mt-2 overflow-x-auto border border-slate-200">
        <table className="w-full min-w-[640px] border-collapse text-left text-[12px]">
          <thead className="bg-[#f4f6f9]">
            <tr>
              <th className="px-3 py-2.5 font-medium text-slate-500">Capacity</th>
              {(['free', 'growth', 'scale'] as const).map((id) => (
                <th key={id} className="px-3 py-2.5 font-semibold" style={{ color: NAVY }}>
                  {planLabel(id)}
                  {id === currentPlan ? (
                    <span className="ml-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[#0062ff]">
                      You
                    </span>
                  ) : null}
                </th>
              ))}
              <th className="px-3 py-2.5 font-semibold" style={{ color: NAVY }}>
                Enterprise
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row) => (
              <tr key={row.label} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-500">{row.label}</td>
                {(['free', 'growth', 'scale'] as const).map((id) => (
                  <td
                    key={id}
                    className="px-3 py-2 font-mono tabular-nums text-slate-800"
                  >
                    {row.value(id)}
                  </td>
                ))}
                <td className="px-3 py-2 text-slate-500">Custom</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppModal>
  )
}
