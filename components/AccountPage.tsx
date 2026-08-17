'use client'

import { useEffect, useState } from 'react'
import { useLocation } from '@/lib/navigation'
import { useAuth } from '@/components/AuthProvider'
import { displayNameForUser, initialsForUser, updateProfile, signOut } from '@/lib/auth'
import {
  getBillingStatus,
  listBoms,
  openBillingPortal,
  startCheckout,
  type BillingAccountStatus,
} from '@/lib/api'
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
  const [billing, setBilling] = useState<BillingAccountStatus | null>(null)
  const [billingBusy, setBillingBusy] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setFirstName(user.firstName)
    setLastName(user.lastName)
    setCompany(user.company)
  }, [user])

  useEffect(() => {
    listBoms()
      .then((page) => setBomCount(page.items.length))
      .catch(() => {})
    getBillingStatus()
      .then(setBilling)
      .catch(() =>
        setBilling({
          plan: 'free',
          status: 'none',
          can_purchase: true,
        }),
      )
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
  const activePlan = billing?.plan ?? 'free'
  const planLimits = limitsFor(activePlan)
  const bomLimit =
    billing?.limits?.active_boms ?? planLimits.activeBoms
  const bomPct = Math.min((bomCount / bomLimit) * 100, 100)
  const planName = planLabel(activePlan)
  const refreshLabel = (billing?.limits?.refresh ?? planLimits.refresh) === 'daily'
    ? 'Daily refresh'
    : 'Weekly refresh'

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-[#0f1b2d]">
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
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: NAVY }}>
                    {planName}
                  </p>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    Status: {billing?.status ?? 'none'}
                    {' · '}
                    {refreshLabel}
                    {billing?.can_purchase
                      ? ' · purchasing on (plan caps apply)'
                      : ' · purchasing locked'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  {activePlan === 'free' ? (
                    <>
                      <button
                        type="button"
                        disabled={billingBusy}
                        onClick={() => handleUpgrade('growth')}
                        className="rounded-lg px-3.5 py-1.5 text-[12px] font-semibold text-white disabled:opacity-60"
                        style={{ background: BLUE }}
                      >
                        Upgrade to Growth
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
                          Upgrade to Scale
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={billingBusy}
                        onClick={handleManageBilling}
                        className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        Manage billing
                      </button>
                    </>
                  )}
                </div>
              </div>
              {billingError ? <p className="mt-3 text-[12px] text-red-600">{billingError}</p> : null}
            </div>
            <div className="px-5 py-4">
              <div className="mb-2 flex items-center justify-between text-[12px]">
                <span className="text-slate-500">BOMs used</span>
                <span className="font-semibold" style={{ color: NAVY }}>
                  {bomCount} / {bomLimit}
                </span>
              </div>
              <div className="mb-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${bomPct}%`, background: BLUE }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {Math.max(bomLimit - bomCount, 0)} monitored BOM slots remaining · {refreshLabel.toLowerCase()}
              </p>
            </div>
          </div>
        </div>

        <div className="pb-16">
          <SectionLabel>Team</SectionLabel>
          <p className="mb-3 text-[12px] text-slate-400">
            Seat invites land next (Mounir). Limits today: {planLimits.seats} seat
            {planLimits.seats === 1 ? '' : 's'} on {shortPlanLabel(activePlan)}.
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-5">
              <p className="mb-3 text-[13px] font-medium" style={{ color: NAVY }}>
                Invite teammates
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:border-[#0062ff] focus:outline-none focus:ring-2 focus:ring-[#0062ff]/20"
                />
                <button
                  disabled={!inviteEmail.includes('@')}
                  className="shrink-0 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-colors disabled:opacity-40"
                  style={{ background: BLUE }}
                >
                  Invite
                </button>
              </div>
            </div>
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
                Admin
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
