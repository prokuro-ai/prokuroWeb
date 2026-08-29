'use client'

import { useEffect, useState } from 'react'
import { useLocation } from '@/lib/navigation'
import { useAuth } from '@/components/AuthProvider'
import { displayNameForUser, initialsForUser, updateProfile, signOut } from '@/lib/auth'
import {
  createTeamInvite,
  getBillingStatus,
  openBillingPortal,
  patchTeamMemberRole,
  removeTeamMember,
  revokeTeamInvite,
  startCheckout,
  type BillingAccountStatus,
  type BillingStatus,
  type PlanSource,
  type TeamInvite,
  type TeamRole,
} from '@/lib/api'
import { useTeam } from '@/hooks/use-team'
import { limitsFor, planLabel as shortPlanLabel } from '@/lib/planLimits'
import { ArrowLeft, LogOut } from 'lucide-react'

const BLUE = '#0062ff'
const NAVY = '#0f1b2d'

function InputField({
  label, value, onChange, readOnly = false, placeholder, type = 'text',
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  readOnly?: boolean
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-medium text-slate-400">{label}</label>
      <input
        type={type}
        readOnly={readOnly}
        value={value}
        onChange={onChange ? e => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2 text-[13px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0062ff]/20 focus:border-[#0062ff] ${
          readOnly
            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-default'
            : 'bg-white border-slate-200 text-[#0f1b2d]'
        }`}
      />
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{children}</p>
  )
}

function planLabel(plan: BillingAccountStatus['plan']) {
  return `${shortPlanLabel(plan)} Plan`
}

function billingStatusLabel(status: BillingStatus | undefined, planSource?: PlanSource) {
  if (planSource === 'admin') return 'Admin-assigned plan'
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

function formatPeriodEnd(value: string | null | undefined) {
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

function inviteDeliveryNotice(invite: { email: string; email_delivery?: string; email_error?: string | null }) {
  switch (invite.email_delivery) {
    case 'sent':
      return `Invite email sent to ${invite.email}.`
    case 'queued':
      return `Invite queued for email delivery to ${invite.email}. Copy the link below if it does not arrive.`
    case 'failed':
      return invite.email_error
        ? `Invite created but email failed: ${invite.email_error}. Copy the link below.`
        : 'Invite created but email delivery failed. Copy the link below.'
    default:
      return 'Invite created. Copy the link below and share it with your teammate.'
  }
}

function UsageMeter({
  label,
  used,
  limit,
}: {
  label: string
  used: number
  limit: number | null | undefined
}) {
  if (limit == null) {
    return (
      <div>
        <div className="mb-1.5 flex items-center justify-between text-[12px]">
          <span className="text-slate-500">{label}</span>
          <span className="font-semibold" style={{ color: NAVY }}>
            {used} / —
          </span>
        </div>
        <div className="mb-1 h-2 overflow-hidden rounded-full bg-slate-100" />
        <p className="text-[11px] text-slate-400">Billing status unavailable</p>
      </div>
    )
  }
  const safeLimit = Math.max(limit, 1)
  const pct = Math.min((used / safeLimit) * 100, 100)
  const remaining = Math.max(limit - used, 0)
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[12px]">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold" style={{ color: NAVY }}>
          {used} / {limit}
        </span>
      </div>
      <div className="mb-1 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: BLUE }}
        />
      </div>
      <p className="text-[11px] text-slate-400">
        {remaining} remaining this period
      </p>
    </div>
  )
}

function roleLabel(role: TeamRole) {
  if (role === 'read_only') return 'Read only'
  if (role === 'admin') return 'Admin'
  if (role === 'owner') return 'Owner'
  return String(role)
}

function memberDisplayName(member: {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  user_id: string
}) {
  const full = [member.first_name, member.last_name]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part) && part !== '-')
    .join(' ')
  return full || member.email || member.user_id
}

function memberInitials(member: {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  user_id: string
}) {
  const first = member.first_name?.trim()
  const last = member.last_name?.trim()
  if ((first && first !== '-') || (last && last !== '-')) {
    return [first?.[0], last?.[0]].filter(Boolean).join('').toUpperCase() || '?'
  }
  const value = member.email ?? member.user_id
  const local = value.split('@')[0] ?? value
  const parts = local.split(/[.\s_-]+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  return local.slice(0, 2).toUpperCase() || '?'
}

export default function AccountPage() {
  const { user, loading, refresh } = useAuth()
  const [, navigate] = useLocation()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [bomCount, setBomCount] = useState(0)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Exclude<TeamRole, 'owner'>>('read_only')
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteNotice, setInviteNotice] = useState<string | null>(null)
  const [lastAcceptUrl, setLastAcceptUrl] = useState<string | null>(null)
  const [billing, setBilling] = useState<BillingAccountStatus | null>(null)
  const [billingBusy, setBillingBusy] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)
  const [billingNotice, setBillingNotice] = useState<string | null>(null)
  const { team, reload: reloadTeam, canManage, canInvite, error: teamError } = useTeam()

  useEffect(() => {
    if (!user) return
    setFirstName(user.firstName)
    setLastName(user.lastName)
    setCompany(user.company)
  }, [user])

  useEffect(() => {
    getBillingStatus()
      .then((status) => {
        setBilling(status)
        setBomCount(status.usage?.active_boms_count ?? 0)
      })
      .catch(() => setBilling(null))
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const billingParam = params.get('billing')
    if (!billingParam) return

    if (billingParam === 'success') {
      setBillingNotice('Payment received. Refreshing your plan…')
      getBillingStatus()
        .then((status) => {
          setBilling(status)
          setBomCount(status.usage?.active_boms_count ?? 0)
          setBillingNotice(`You're on the ${planLabel(status.plan)}.`)
        })
        .catch(() => {
          setBillingNotice('Payment received. Your plan will update shortly.')
        })
    } else if (billingParam === 'cancel') {
      setBillingNotice('Checkout canceled — no changes were made.')
    }

    params.delete('billing')
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`
    window.history.replaceState({}, '', next)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({ firstName, lastName, company })
      await refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    await refresh()
    navigate('/login')
  }

  const handleCancel = () => {
    if (!user) return
    setFirstName(user.firstName)
    setLastName(user.lastName)
    setCompany(user.company)
  }

  const handleUpgrade = async (plan: 'growth' | 'scale') => {
    setBillingBusy(true)
    setBillingError(null)
    try {
      const origin = window.location.origin
      const url = await startCheckout(
        plan,
        `${origin}/account?billing=success`,
        `${origin}/account?billing=cancel`,
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
      const url = await openBillingPortal(`${window.location.origin}/account`)
      window.location.href = url
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : 'Billing portal unavailable')
      setBillingBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 font-sans text-[13px] text-slate-400">
        Loading…
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 font-sans text-[13px] text-slate-400">
        Sign in to manage your account.
      </div>
    )
  }

  const initials = initialsForUser(user)
  const displayName = displayNameForUser(user)
  const billingReady = billing != null
  const activePlan = billing?.plan
  const planLimits = activePlan ? limitsFor(activePlan) : null
  const apiLimits = billing?.limits
  const usage = billing?.usage
  const bomLimit = apiLimits?.active_boms ?? planLimits?.activeBoms
  const analysesLimit = apiLimits?.analyses_per_month ?? planLimits?.analysesPerMonth
  const linesLimit = apiLimits?.lines_per_month ?? planLimits?.linesPerMonth
  const purchasingLimit =
    apiLimits?.purchasing_actions_per_month ?? planLimits?.purchasingActionsPerMonth
  const ordersLimit = apiLimits?.orders_per_month ?? planLimits?.ordersPerMonth
  const seatsLimit = team?.seats.limit ?? apiLimits?.seats ?? planLimits?.seats
  const seatsUsed = team?.seats.used ?? 1
  const planName = billingReady && activePlan ? planLabel(activePlan) : 'Billing unavailable'
  const refreshLabel =
    (apiLimits?.refresh ?? planLimits?.refresh) === 'daily'
      ? 'Daily refresh'
      : (apiLimits?.refresh ?? planLimits?.refresh) === 'weekly'
        ? 'Weekly refresh'
        : null
  const periodEnd = formatPeriodEnd(billing?.current_period_end)
  const statusLabel = billingReady
    ? billingStatusLabel(billing?.status, billing?.plan_source)
    : null
  const bomUsed = usage?.active_boms_count ?? bomCount

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 font-sans text-[#0f1b2d]">
      <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-[13px] text-slate-500 transition-colors hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
          <span className="text-slate-200">/</span>
          <span className="text-[13px] font-semibold" style={{ color: NAVY }}>
            Account settings
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-[12px] text-slate-400 transition-colors hover:text-red-600"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>

      <div className="mx-auto max-w-2xl space-y-8 px-6 py-8">
        <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
            style={{ background: BLUE }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[18px] font-semibold" style={{ color: NAVY }}>
              {displayName || user.email}
            </p>
            <p className="truncate text-[13px] text-slate-500">{user.email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {user.company?.trim() && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#0062ff]">
                  {user.company}
                </span>
              )}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                {planName}
              </span>
            </div>
          </div>
        </div>

        <div>
          <SectionLabel>Profile</SectionLabel>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-5">
              <div className="grid grid-cols-2 gap-3">
                <InputField label="First name" value={firstName} onChange={setFirstName} />
                <InputField label="Last name" value={lastName} onChange={setLastName} />
              </div>
            </div>
            <div className="border-b border-slate-100 px-5 py-4">
              <InputField label="Work email" value={user.email} readOnly type="email" />
            </div>
            <div className="border-b border-slate-100 px-5 py-4">
              <InputField
                label="Company"
                value={company}
                onChange={setCompany}
                placeholder="Your company"
              />
            </div>
            <div className="flex items-center justify-end gap-2 bg-slate-50 px-5 py-3">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="rounded-lg px-4 py-2 text-[12px] font-medium text-slate-400 transition-colors hover:text-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-medium text-white transition-colors disabled:opacity-60"
                style={{ background: BLUE }}
              >
                {saved ? 'Saved' : saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>

        <div>
          <SectionLabel>Billing</SectionLabel>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold" style={{ color: NAVY }}>
                    {planName}
                  </p>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    {billingReady && statusLabel
                      ? `${statusLabel}${
                          refreshLabel ? ` · ${refreshLabel}` : ''
                        }${
                          billing.can_purchase
                            ? ' · purchasing on (plan caps apply)'
                            : ' · purchasing locked until subscription is active'
                        }`
                      : 'Billing status unavailable — try refreshing'}
                  </p>
                  {periodEnd ? (
                    <p className="mt-1 text-[12px] text-slate-400">
                      Current period ends {periodEnd}
                    </p>
                  ) : null}
                  {billing?.admin_expires_at ? (
                    <p className="mt-1 text-[12px] text-slate-400">
                      Admin plan expires {formatPeriodEnd(billing.admin_expires_at)}
                    </p>
                  ) : null}
                  {billingReady && bomLimit != null && linesLimit != null ? (
                    <p className="mt-2 text-[12px] text-slate-400">
                      {seatsLimit ?? '—'} seat{(seatsLimit ?? 0) === 1 ? '' : 's'} · up to {bomLimit}{' '}
                      monitored BOM
                      {bomLimit === 1 ? '' : 's'} · {linesLimit.toLocaleString()} lines / month ·{' '}
                      {apiLimits?.max_lines_per_bom ?? planLimits?.maxLinesPerBom ?? '—'} lines max
                      per BOM
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  {!billingReady ? (
                    <button
                      type="button"
                      disabled={billingBusy}
                      onClick={() => {
                        setBillingBusy(true)
                        setBillingError(null)
                        getBillingStatus()
                          .then((status) => {
                            setBilling(status)
                            setBomCount(status.usage?.active_boms_count ?? 0)
                          })
                          .catch(() => {
                            setBilling(null)
                            setBillingError('Could not load billing status')
                          })
                          .finally(() => setBillingBusy(false))
                      }}
                      className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {billingBusy ? 'Refreshing…' : 'Retry billing'}
                    </button>
                  ) : activePlan === 'free' ? (
                    <>
                      <button
                        type="button"
                        disabled={billingBusy}
                        onClick={() => handleUpgrade('growth')}
                        className="rounded-lg px-3.5 py-1.5 text-[12px] font-semibold text-white disabled:opacity-60"
                        style={{ background: BLUE }}
                      >
                        {billingBusy ? 'Opening…' : 'Upgrade to Growth'}
                      </button>
                      <button
                        type="button"
                        disabled={billingBusy}
                        onClick={() => navigate('/pricing')}
                        className="rounded-lg border px-3.5 py-1.5 text-[12px] font-semibold transition-colors hover:bg-blue-50"
                        style={{ color: BLUE, borderColor: '#bfdbfe' }}
                      >
                        View plans
                      </button>
                      {billing?.stripe_customer_id ? (
                        <button
                          type="button"
                          disabled={billingBusy}
                          onClick={handleManageBilling}
                          className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                          {billingBusy ? 'Opening…' : 'Manage billing'}
                        </button>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {activePlan !== 'scale' ? (
                        <button
                          type="button"
                          disabled={billingBusy}
                          onClick={() => handleUpgrade('scale')}
                          className="rounded-lg border px-3.5 py-1.5 text-[12px] font-semibold transition-colors hover:bg-blue-50 disabled:opacity-60"
                          style={{ color: BLUE, borderColor: '#bfdbfe' }}
                        >
                          {billingBusy ? 'Opening…' : 'Upgrade to Scale'}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={billingBusy || !billing?.stripe_customer_id}
                        onClick={handleManageBilling}
                        className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        title={
                          billing?.stripe_customer_id
                            ? undefined
                            : 'Complete checkout once to unlock the Stripe customer portal'
                        }
                      >
                        {billingBusy ? 'Opening…' : 'Manage billing'}
                      </button>
                    </>
                  )}
                </div>
              </div>
              {billingNotice ? (
                <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[12px] text-[#0062ff]">
                  {billingNotice}
                </p>
              ) : null}
              {billingError ? (
                <p className="mt-3 text-[12px] text-red-600">{billingError}</p>
              ) : null}
            </div>

            <div className="grid gap-5 px-5 py-5 sm:grid-cols-2">
              <UsageMeter label="Team seats" used={seatsUsed} limit={seatsLimit} />
              <UsageMeter label="Monitored BOMs" used={bomUsed} limit={bomLimit} />
              <UsageMeter
                label="Analyses this month"
                used={usage?.analyses_count ?? 0}
                limit={analysesLimit}
              />
              <UsageMeter
                label="Lines analyzed this month"
                used={usage?.lines_count ?? 0}
                limit={linesLimit}
              />
              <UsageMeter
                label="Purchasing actions"
                used={usage?.purchasing_actions_count ?? 0}
                limit={purchasingLimit}
              />
              <UsageMeter
                label="Orders this month"
                used={usage?.orders_count ?? 0}
                limit={ordersLimit}
              />
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-[11px] text-slate-400">
              Usage meters reflect your current plan caps. Monthly counters reset on the calendar month;
              Stripe subscriptions also show the billing period above when applicable.
            </div>
          </div>
        </div>

        <div className="pb-16">
          <SectionLabel>Team</SectionLabel>
          {teamError && !team ? (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
              Could not load team ({teamError}). Invite and role controls may be hidden.{' '}
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => reloadTeam()}
              >
                Retry
              </button>
            </div>
          ) : teamError ? (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
              Team refresh failed ({teamError}). Showing last known members.{' '}
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => reloadTeam()}
              >
                Retry
              </button>
            </div>
          ) : null}
          <p className="mb-3 text-[12px] text-slate-400">
            {billingReady && activePlan
              ? `${seatsUsed} / ${seatsLimit ?? '—'} seats on ${shortPlanLabel(activePlan)}.`
              : `${seatsUsed} seat${seatsUsed === 1 ? '' : 's'} · plan unavailable.`}
            {team ? ` Your role: ${roleLabel(team.role)}.` : ''}
            {!canInvite && activePlan === 'free'
              ? ' Upgrade or ask us to enable a pilot plan before inviting teammates.'
              : !canInvite && seatsLimit != null && seatsUsed >= seatsLimit
                ? ' All seats are in use — revoke a pending invite or upgrade to add teammates.'
                : ''}
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {(team?.members ?? []).map((member) => (
              <div
                key={member.user_id}
                className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: BLUE }}
                >
                  {memberInitials(member)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium" style={{ color: NAVY }}>
                    {memberDisplayName(member)}
                    {member.user_id === team?.user_id ? ' (you)' : ''}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">
                    {member.email || member.user_id}
                  </p>
                </div>
                {canManage && member.role !== 'owner' ? (
                  <select
                    value={member.role}
                    onChange={async (e) => {
                      const role = e.target.value as Exclude<TeamRole, 'owner'>
                      try {
                        await patchTeamMemberRole(member.user_id, role)
                        await reloadTeam()
                      } catch (err) {
                        setInviteError(err instanceof Error ? err.message : 'Could not update role')
                      }
                    }}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                  >
                    <option value="read_only">Read only</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    {roleLabel(member.role)}
                  </span>
                )}
                {canManage && member.role !== 'owner' ? (
                  <button
                    type="button"
                    className="text-[11px] font-medium text-slate-400 hover:text-red-500"
                    onClick={async () => {
                      try {
                        await removeTeamMember(member.user_id)
                        await reloadTeam()
                      } catch (err) {
                        setInviteError(err instanceof Error ? err.message : 'Could not remove member')
                      }
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}

            {!team?.members?.length ? (
              <div className="flex items-center gap-3 px-5 py-4">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: BLUE }}
                >
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium" style={{ color: NAVY }}>
                    {displayName || user.email}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">{user.email}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  Owner
                </span>
              </div>
            ) : null}

            {(team?.invites ?? []).map((invite: TeamInvite) => (
              <div
                key={invite.id}
                className="flex items-center gap-3 border-t border-slate-100 px-5 py-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                  …
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium" style={{ color: NAVY }}>
                    {invite.email}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">
                    Pending · {roleLabel(invite.role)} · expires{' '}
                    {new Date(invite.expires_at).toLocaleDateString()}
                    {invite.accept_url ? ' · copy link if needed' : ''}
                  </p>
                  {invite.accept_url ? (
                    <button
                      type="button"
                      className="mt-1 text-[11px] font-semibold text-[#0062ff] hover:underline"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(invite.accept_url!)
                          setLastAcceptUrl(invite.accept_url!)
                        } catch {
                          setLastAcceptUrl(invite.accept_url!)
                        }
                      }}
                    >
                      Copy invite link
                    </button>
                  ) : null}
                </div>
                {canManage ? (
                  <button
                    type="button"
                    className="text-[11px] font-medium text-slate-400 hover:text-red-500"
                    onClick={async () => {
                      try {
                        await revokeTeamInvite(invite.id)
                        await reloadTeam()
                      } catch (err) {
                        setInviteError(err instanceof Error ? err.message : 'Could not revoke invite')
                      }
                    }}
                  >
                    Revoke
                  </button>
                ) : null}
              </div>
            ))}

            {canInvite ? (
              <div className="border-t border-slate-100 bg-slate-50 px-5 py-5">
                <p className="mb-1 text-[13px] font-medium" style={{ color: NAVY }}>
                  Invite a teammate
                </p>
                <p className="mb-3 text-[12px] text-slate-400">
                  We email an accept link via SNS when delivery is configured. Always copy the link as
                  a fallback.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] focus:border-[#0062ff] focus:outline-none focus:ring-2 focus:ring-[#0062ff]/20"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as Exclude<TeamRole, 'owner'>)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-[#0f1b2d]"
                  >
                    <option value="read_only">Read only</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="button"
                    disabled={!inviteEmail.includes('@') || inviteBusy}
                    onClick={async () => {
                      setInviteBusy(true)
                      setInviteError(null)
                      setInviteNotice(null)
                      setLastAcceptUrl(null)
                      try {
                        const invite = await createTeamInvite(inviteEmail.trim(), inviteRole)
                        setInviteEmail('')
                        if (invite.accept_url) {
                          setLastAcceptUrl(invite.accept_url)
                        }
                        setInviteNotice(inviteDeliveryNotice(invite))
                        await reloadTeam()
                      } catch (err) {
                        setInviteError(err instanceof Error ? err.message : 'Invite failed')
                      } finally {
                        setInviteBusy(false)
                      }
                    }}
                    className="shrink-0 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-colors disabled:opacity-40"
                    style={{ background: BLUE }}
                  >
                    {inviteBusy ? 'Sending…' : 'Invite'}
                  </button>
                </div>
                {inviteNotice ? (
                  <p className="mt-2 text-[12px] text-emerald-700">{inviteNotice}</p>
                ) : null}
                {inviteError ? (
                  <p className="mt-2 text-[12px] text-red-600">{inviteError}</p>
                ) : null}
                {lastAcceptUrl ? (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <p className="text-[11px] font-medium text-slate-500">Invite link</p>
                    <a
                      href={lastAcceptUrl}
                      className="mt-1 block break-all text-[12px] font-medium text-[#0062ff] hover:underline"
                    >
                      {lastAcceptUrl}
                    </a>
                    <button
                      type="button"
                      className="mt-2 text-[11px] font-semibold text-slate-600 hover:text-[#0062ff]"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(lastAcceptUrl)
                        } catch {
                          /* ignore */
                        }
                      }}
                    >
                      Copy link
                    </button>
                  </div>
                ) : null}
              </div>
            ) : inviteError ? (
              <div className="border-t border-slate-100 px-5 py-4">
                <p className="text-[12px] text-red-600">{inviteError}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
