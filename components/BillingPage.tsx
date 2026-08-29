'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { PricingModal } from '@/components/billing/PricingModal'
import { UsageMeter } from '@/components/billing/UsageMeter'
import { useTeam } from '@/hooks/use-team'
import {
  getBillingStatus,
  openBillingPortal,
  startCheckout,
  type BillingAccountStatus,
} from '@/lib/api'
import {
  billingStatusLabel,
  formatCap,
  formatPeriodEnd,
  bedrockLabel,
  planTitle,
  refreshLabel,
} from '@/lib/billing-display'
import { SCHEDULE_DEMO_PATH } from '@/lib/sales'
import type { PublicPlan } from '@/lib/publicPlans'

const NAVY = '#0f1b2d'
const BLUE = '#0062ff'

export default function BillingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const { team } = useTeam()

  const [billing, setBilling] = useState<BillingAccountStatus | null>(null)
  const [billingLoaded, setBillingLoaded] = useState(false)
  const [billingBusy, setBillingBusy] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)
  const [billingNotice, setBillingNotice] = useState<string | null>(null)
  const [plansOpen, setPlansOpen] = useState(false)

  const loadBilling = async () => {
    const status = await getBillingStatus()
    setBilling(status)
    return status
  }

  useEffect(() => {
    loadBilling()
      .catch(() => {
        setBilling(null)
        setBillingError('Could not load billing status from the server')
      })
      .finally(() => setBillingLoaded(true))
  }, [])

  useEffect(() => {
    const billingParam = searchParams.get('billing')
    const plansParam = searchParams.get('plans')
    if (!billingParam && plansParam !== '1') return

    if (billingParam === 'success') {
      setBillingNotice('Payment received. Refreshing your plan…')
      loadBilling()
        .then((status) => {
          setBillingNotice(`You're on the ${planTitle(status.plan)}.`)
        })
        .catch(() => {
          setBillingNotice('Payment received. Your plan will update shortly.')
        })
    } else if (billingParam === 'cancel') {
      setBillingNotice('Checkout canceled — no changes were made.')
    }

    if (plansParam === '1') setPlansOpen(true)

    const next = new URLSearchParams(searchParams.toString())
    next.delete('billing')
    next.delete('plans')
    const query = next.toString()
    router.replace(query ? `/billing?${query}` : '/billing', { scroll: false })
  }, [searchParams, router])

  const handleUpgrade = async (plan: 'growth' | 'scale') => {
    setBillingBusy(true)
    setBillingError(null)
    try {
      const origin = window.location.origin
      const url = await startCheckout(
        plan,
        `${origin}/billing?billing=success`,
        `${origin}/billing?billing=cancel`,
      )
      window.location.href = url
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : 'Checkout failed')
      setBillingBusy(false)
    }
  }

  const handleManageBilling = async () => {
    setBillingBusy(true)
    setBillingError(null)
    try {
      const url = await openBillingPortal(`${window.location.origin}/billing`)
      window.location.href = url
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : 'Billing portal unavailable')
      setBillingBusy(false)
    }
  }

  const handleSelectPlan = (plan: PublicPlan) => {
    if (plan.salesLed) {
      router.push(SCHEDULE_DEMO_PATH)
      return
    }
    if (plan.id === 'free') {
      setPlansOpen(false)
      return
    }
    if (plan.id === 'growth' || plan.id === 'scale') {
      void handleUpgrade(plan.id)
    }
  }

  const limits = billing?.limits
  const usage = billing?.usage
  const seatsUsed = team?.seats.used
  const seatsLimit = team?.seats.limit ?? limits?.seats
  const periodEnd = formatPeriodEnd(billing?.current_period_end)
  const adminExpiry = formatPeriodEnd(billing?.admin_expires_at)
  const statusLabel = billing
    ? billingStatusLabel(billing.status, billing.plan_source)
    : null

  if (loading || !billingLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#f4f6f9] text-[13px] text-slate-400">
        Loading…
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#f4f6f9] text-[13px] text-slate-400">
        Sign in to view billing.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f6f9] font-sans text-[#0f1b2d]">
      <div className="border-b border-slate-200 bg-white px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
              Account
            </p>
            <h1 className="mt-1 text-[20px] font-semibold tracking-tight" style={{ color: NAVY }}>
              Billing
            </h1>
            <p className="mt-1 max-w-xl text-[13px] text-slate-500">
              Live usage and caps from your account billing status. Compare-plans copy is catalog
              only — it is not this snapshot.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={billingBusy}
              onClick={() => setPlansOpen(true)}
              className="px-3.5 py-2 text-[12px] font-semibold text-white disabled:opacity-60"
              style={{ background: BLUE }}
            >
              Compare plans
            </button>
            <button
              type="button"
              disabled={billingBusy || !billing?.stripe_customer_id}
              onClick={handleManageBilling}
              className="border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              title={
                billing?.stripe_customer_id
                  ? undefined
                  : 'Complete checkout once to unlock the Stripe customer portal'
              }
            >
              {billingBusy ? 'Opening…' : 'Manage in Stripe'}
            </button>
            <button
              type="button"
              disabled={billingBusy}
              onClick={() => {
                setBillingBusy(true)
                setBillingError(null)
                loadBilling()
                  .catch(() => {
                    setBilling(null)
                    setBillingError('Could not load billing status')
                  })
                  .finally(() => setBillingBusy(false))
              }}
              className="inline-flex items-center gap-1.5 border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6">
        {billingNotice ? (
          <p className="border border-blue-100 bg-blue-50 px-4 py-3 text-[13px] text-[#0062ff]">
            {billingNotice}
          </p>
        ) : null}
        {billingError ? (
          <p className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {billingError}
          </p>
        ) : null}

        <section className="border border-slate-200 bg-white">
          <div className="grid gap-6 px-5 py-5 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[16px] font-semibold" style={{ color: NAVY }}>
                  {planTitle(billing?.plan)}
                </h2>
                {statusLabel ? (
                  <span className="border border-slate-200 bg-[#f4f6f9] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
                    {statusLabel}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-[13px] text-slate-500">
                {billing
                  ? billing.can_purchase
                    ? 'Purchasing is on. Monthly actions and orders still count against this plan.'
                    : 'Purchasing stays locked until a paid subscription is active.'
                  : 'Billing status unavailable — refresh to retry.'}
              </p>
              <dl className="mt-4 grid gap-3 text-[12px] sm:grid-cols-2">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    Period
                  </dt>
                  <dd className="mt-1 text-slate-700">
                    {periodEnd ? `Renews or closes ${periodEnd}` : 'Calendar month usage'}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    Source
                  </dt>
                  <dd className="mt-1 text-slate-700">
                    {billing?.plan_source === 'admin'
                      ? 'Assigned by Prokuro'
                      : billing?.plan_source === 'stripe'
                        ? 'Stripe subscription'
                        : 'Free tier'}
                  </dd>
                </div>
                {adminExpiry ? (
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
                      Admin expiry
                    </dt>
                    <dd className="mt-1 text-slate-700">{adminExpiry}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
            <div className="grid grid-cols-2 gap-px bg-slate-200">
              <Entitlement label="Refresh" value={refreshLabel(limits?.refresh)} />
              <Entitlement label="Analyst" value={bedrockLabel(limits?.bedrock)} />
              <Entitlement
                label="Max lines / BOM"
                value={formatCap(limits?.max_lines_per_bom)}
              />
              <Entitlement
                label="Concurrent analyses"
                value={formatCap(limits?.concurrent_analyses)}
              />
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-semibold" style={{ color: NAVY }}>
                Usage this period
              </h2>
              <p className="mt-0.5 text-[12px] text-slate-400">
                Analyses, lines, purchasing, and orders come from billing status. Seats come from
                the team snapshot. Monthly counters reset on the calendar month.
              </p>
            </div>
          </div>
          <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-3">
            <UsageMeter label="Team seats" used={seatsUsed} limit={seatsLimit} hint="Members and pending invites from the team API" />
            <UsageMeter
              label="Monitored BOMs"
              used={usage?.active_boms_count}
              limit={limits?.active_boms}
            />
            <UsageMeter
              label="Analyses this month"
              used={usage?.analyses_count}
              limit={limits?.analyses_per_month}
            />
            <UsageMeter
              label="Lines analyzed this month"
              used={usage?.lines_count}
              limit={limits?.lines_per_month}
            />
            <UsageMeter
              label="Purchasing actions"
              used={usage?.purchasing_actions_count}
              limit={limits?.purchasing_actions_per_month}
            />
            <UsageMeter
              label="Orders this month"
              used={usage?.orders_count}
              limit={limits?.orders_per_month}
            />
          </div>
        </section>

        <section className="border border-slate-200 bg-white px-5 py-5">
          <h2 className="text-[14px] font-semibold" style={{ color: NAVY }}>
            Plan entitlements
          </h2>
          <p className="mt-1 text-[12px] text-slate-400">
            Caps from the same billing-status payload. Unique MPN lookups reset daily on the server.
          </p>
          <dl className="mt-4 grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
            <Entitlement label="Seats" value={formatCap(seatsLimit)} />
            <Entitlement label="Active BOMs" value={formatCap(limits?.active_boms)} />
            <Entitlement
              label="Unique MPN lookups / day"
              value={formatCap(limits?.unique_mpn_lookups_per_day)}
            />
            <Entitlement
              label="Bedrock"
              value={bedrockLabel(limits?.bedrock)}
            />
          </dl>
        </section>
      </div>

      <PricingModal
        open={plansOpen}
        onClose={() => setPlansOpen(false)}
        currentPlan={billing?.plan}
        busy={billingBusy}
        error={billingError}
        onSelect={handleSelectPlan}
      />
    </div>
  )
}

function Entitlement({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-4 py-3">
      <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">{label}</dt>
      <dd className="mt-1 text-[13px] font-semibold" style={{ color: NAVY }}>
        {value}
      </dd>
    </div>
  )
}
