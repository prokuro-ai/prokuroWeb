'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useTeam } from '@/hooks/use-team'
import { getBillingStatus, type BillingAccountStatus } from '@/lib/api'
import { formatPeriodEnd } from '@/lib/billing-display'
import { SALES_EMAIL } from '@/lib/sales'

const CONTRACT_MAILTO = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent('Prokuro contract')}`

export default function PlanPane() {
  const { user } = useAuth()
  const { team } = useTeam()
  const [billing, setBilling] = useState<BillingAccountStatus | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const status = await getBillingStatus()
    setBilling(status)
    setError(null)
    return status
  }, [])

  useEffect(() => {
    let cancelled = false
    load()
      .catch(() => {
        if (!cancelled) {
          setBilling(null)
          setError('Could not load plan status from the server')
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [load])

  if (!user) return null

  if (!loaded) {
    return <p className="text-[13px] text-mk-ink-subtle">Loading…</p>
  }

  const ends = formatPeriodEnd(billing?.admin_expires_at ?? billing?.current_period_end)
  const enabled = Boolean(billing?.provisioned || billing?.is_operator)
  const statusLabel = billing?.is_operator
    ? 'Operator account. Customers are enabled from Admin.'
    : enabled
      ? ends
        ? `This account is on through ${ends}.`
        : 'This account is on.'
      : 'This account is waiting to be enabled.'

  return (
    <div className="space-y-5">
      {error ? <p className="text-[13px] text-mk-red">{error}</p> : null}

      <div>
        <p className="text-[13px] font-medium text-mk-ink">{enabled ? 'Enabled' : 'Waiting for access'}</p>
        <p className="mt-1 text-[13px] text-mk-ink-muted">{statusLabel}</p>
      </div>

      <dl className="grid grid-cols-2 gap-4">
        <div>
          <dt className="text-[12px] font-medium text-mk-ink-subtle">People</dt>
          <dd className="mt-1 text-[15px] font-medium text-mk-ink">{team?.seats.used ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-[12px] font-medium text-mk-ink-subtle">BOMs</dt>
          <dd className="mt-1 text-[15px] font-medium text-mk-ink">{billing?.usage.active_boms_count ?? '—'}</dd>
        </div>
      </dl>

      <p className="text-[13px] text-mk-ink-muted">
        Need a change to the contract?{' '}
        <a href={CONTRACT_MAILTO} className="font-medium text-mk-accent">
          Email sales
        </a>
        .
      </p>
    </div>
  )
}
