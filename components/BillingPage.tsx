'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useTeam } from '@/hooks/use-team'
import { getBillingStatus, type BillingAccountStatus } from '@/lib/api'
import { formatPeriodEnd } from '@/lib/billing-display'
import { SALES_MAILTO } from '@/lib/sales'
import PageHeader from '@/components/app/PageHeader'
import { appPage, appSection, appSheet } from '@/components/app/chrome'

export default function BillingPage() {
  const { user, loading } = useAuth()
  const { team } = useTeam()
  const [billing, setBilling] = useState<BillingAccountStatus | null>(null)
  const [billingLoaded, setBillingLoaded] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)

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
          setBillingError('Could not load access status from the server')
        }
      })
      .finally(() => {
        if (!cancelled) setBillingLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [loadBilling])

  const ends = formatPeriodEnd(billing?.admin_expires_at ?? billing?.current_period_end)
  const enabled = Boolean(billing?.provisioned || billing?.is_operator)

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
        Sign in to view access.
      </div>
    )
  }

  return (
    <div className={appPage}>
      <PageHeader
        title="Access"
        description="This account is enabled by contract. Usage limits are not enforced in the product."
      />
      <div className={`${appSection} space-y-6`}>
        {billingError ? (
          <p className="border border-mk-red/30 bg-mk-canvas px-4 py-3 text-[13px] text-mk-red">{billingError}</p>
        ) : null}
        <section className={`${appSheet} px-5 py-5`}>
          <h2 className="mk-app-title text-mk-ink">{enabled ? 'Enabled' : 'Waiting for access'}</h2>
          <p className="mt-2 max-w-2xl text-[13px] text-mk-ink-muted">
            {billing?.is_operator
              ? 'Operator account. You can enable customers from Admin.'
              : enabled
                ? ends
                  ? `Access is on through ${ends}.`
                  : 'Access is on for this account.'
                : 'We have your registration and will reach out. You cannot upload BOMs until we enable the account.'}
          </p>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="mk-eyebrow">People on the account</dt>
              <dd className="mt-1.5 text-[15px] font-medium text-mk-ink">{team?.seats.used ?? '—'}</dd>
            </div>
            <div>
              <dt className="mk-eyebrow">BOMs on file</dt>
              <dd className="mt-1.5 text-[15px] font-medium text-mk-ink">
                {billing?.usage.active_boms_count ?? '—'}
              </dd>
            </div>
          </dl>
          <p className="mt-6 text-[13px] text-mk-ink-muted">
            Need a change to the contract?{' '}
            <a href={SALES_MAILTO} className="font-medium text-mk-accent">
              Email sales
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
