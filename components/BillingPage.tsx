'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { PricingModal } from '@/components/billing/PricingModal'
import EmbeddedCheckoutDialog from '@/components/billing/EmbeddedCheckoutDialog'
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
import PageHeader from '@/components/app/PageHeader'
import { appGhostBtn, appPage, appPrimaryBtn, appSection, appSheet } from '@/components/app/chrome'

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
  const [checkoutSecret, setCheckoutSecret] = useState<string | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const loadBilling = useCallback(async () => {
    const status = await getBillingStatus()
    setBilling(status)
    setBillingError(null)
    return status
  }, [])

  useEffect(() => {
    let cancelled = false
    loadBilling()
      .catch(() => {
        if (!cancelled) {
          setBilling(null)
          setBillingError('Could not load billing status from the server')
        }
      })
      .finally(() => {
        if (!cancelled) setBillingLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [loadBilling])

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== 'visible') return
      loadBilling().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [loadBilling])

  useEffect(() => {
    const billingParam = searchParams.get('billing')
    const plansParam = searchParams.get('plans')
    if (!billingParam && plansParam !== '1') return

    if (billingParam === 'success') {
      setBillingNotice('Payment received. Updating your plan…')
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
  }, [searchParams, router, loadBilling])

  const handleUpgrade = async (plan: 'growth' | 'scale') => {
    setBillingBusy(true)
    setBillingError(null)
    setCheckoutSecret(null)
    try {
      const origin = window.location.origin
      const clientSecret = await startCheckout(
        plan,
        `${origin}/billing?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      )
      setCheckoutSecret(clientSecret)
      setCheckoutOpen(true)
      setPlansOpen(false)
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : 'Checkout failed')
    } finally {
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
      <div className="flex flex-1 items-center justify-center bg-mk-raised font-mk-sans text-[13px] text-mk-ink-subtle">
        Loading…
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-mk-raised font-mk-sans text-[13px] text-mk-ink-subtle">
        Sign in to view your plan.
      </div>
    )
  }

  return (
    <div className={appPage}>
      <PageHeader
        title="Your plan"
        description="What you can upload, how often BOMs refresh, and who can join."
          actions={
          <>
            <button
              type="button"
              disabled={billingBusy}
              onClick={() => setPlansOpen(true)}
              className={appPrimaryBtn}
            >
              Compare plans
            </button>
            <button
              type="button"
              disabled={billingBusy || !billing?.stripe_customer_id}
              onClick={handleManageBilling}
              className={appGhostBtn}
              title={
                billing?.stripe_customer_id
                  ? undefined
                  : 'Complete checkout once to manage cards and invoices'
              }
            >
              {billingBusy ? 'Opening…' : 'Manage billing'}
            </button>
          </>
        }
      />

      <div className={`${appSection} space-y-6`}>
        {billingNotice ? (
          <p className="border border-mk-accent/25 bg-mk-canvas px-4 py-3 text-[13px] text-mk-accent">
            {billingNotice}
          </p>
        ) : null}
        {billingError ? (
          <p className="border border-mk-red/30 bg-mk-canvas px-4 py-3 text-[13px] text-mk-red">{billingError}</p>
        ) : null}

        <section className={`${appSheet} px-5 py-5`}>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mk-app-title text-mk-ink">{planTitle(billing?.plan)}</h2>
            {statusLabel ? (
              <span className="rounded-[8px] bg-mk-raised px-2 py-0.5 text-[12px] text-mk-ink-muted">
                {statusLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-2 max-w-2xl text-[13px] text-mk-ink-muted">
            {billing
              ? billing.can_purchase
                ? 'You can get quotes. Monthly buys and orders still count against this plan.'
                : 'Quotes and orders stay locked until a paid plan is active.'
              : 'Could not load your plan.'}
          </p>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Entitlement
              label="Period"
              value={periodEnd ? `Renews ${periodEnd}` : 'Resets each month'}
            />
            <Entitlement
              label="How you got it"
              value={
                billing?.plan_source === 'admin'
                  ? 'Assigned by Prokuro'
                  : billing?.plan_source === 'stripe'
                    ? 'Paid subscription'
                    : 'Free tier'
              }
            />
            <Entitlement label="BOM refresh" value={refreshLabel(limits?.refresh)} />
            <Entitlement label="Max parts / BOM" value={formatCap(limits?.max_lines_per_bom)} />
            {adminExpiry ? <Entitlement label="Assigned until" value={adminExpiry} /> : null}
            <Entitlement label="Line briefs" value={bedrockLabel(limits?.bedrock)} />
            <Entitlement label="BOMs at once" value={formatCap(limits?.concurrent_analyses)} />
          </dl>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="mk-app-heading text-mk-ink">This month</h2>
            <p className="mt-0.5 text-[13px] text-mk-ink-muted">
              Uploads, people on the account, and buys. Counters reset on the calendar month.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <UsageMeter
              label="People on the account"
              used={seatsUsed}
              limit={seatsLimit}
              hint="Members plus pending invites"
            />
            <UsageMeter label="BOMs on file" used={usage?.active_boms_count} limit={limits?.active_boms} />
            <UsageMeter
              label="BOM uploads this month"
              used={usage?.analyses_count}
              limit={limits?.analyses_per_month}
            />
            <UsageMeter
              label="Parts screened this month"
              used={usage?.lines_count}
              limit={limits?.lines_per_month}
            />
            <UsageMeter
              label="Quotes this month"
              used={usage?.purchasing_actions_count}
              limit={limits?.purchasing_actions_per_month}
            />
            <UsageMeter label="Orders this month" used={usage?.orders_count} limit={limits?.orders_per_month} />
          </div>
        </section>

        <section className={`${appSheet} px-5 py-5`}>
          <h2 className="mk-app-heading text-mk-ink">What this plan includes</h2>
          <p className="mt-1 text-[13px] text-mk-ink-muted">
            Unique part lookups reset every day. Seat and BOM caps are the same numbers as above.
          </p>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Entitlement label="People who can join" value={formatCap(seatsLimit)} />
            <Entitlement label="BOMs on file" value={formatCap(limits?.active_boms)} />
            <Entitlement label="Unique part lookups / day" value={formatCap(limits?.unique_mpn_lookups_per_day)} />
            <Entitlement label="Line briefs" value={bedrockLabel(limits?.bedrock)} />
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
      <EmbeddedCheckoutDialog
        open={checkoutOpen}
        clientSecret={checkoutSecret}
        error={billingError}
        onClose={() => {
          setCheckoutOpen(false)
          setCheckoutSecret(null)
          loadBilling().catch(() => {})
        }}
      />
    </div>
  )
}

function Entitlement({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="mk-eyebrow">{label}</dt>
      <dd className="mt-1.5 text-[15px] font-medium text-mk-ink">{value}</dd>
    </div>
  )
}
