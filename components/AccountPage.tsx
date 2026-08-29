'use client'

import { useEffect, useState } from 'react'
import { useLocation } from '@/lib/navigation'
import { useAuth } from '@/components/AuthProvider'
import { displayNameForUser, initialsForUser, updateProfile, signOut } from '@/lib/auth'
import {
  createTeamInvite,
  getBillingStatus,
  patchTeamMemberRole,
  removeTeamMember,
  revokeTeamInvite,
  type BillingAccountStatus,
  type TeamInvite,
  type TeamRole,
} from '@/lib/api'
import { useTeam } from '@/hooks/use-team'
import { planLabel as shortPlanLabel } from '@/lib/planLimits'
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

function roleLabel(role: TeamRole) {
  if (role === 'read_only') return 'Read only'
  if (role === 'admin') return 'Admin'
  if (role === 'owner') return 'Owner'
  return String(role)
}

function initialsForEmail(value: string) {
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

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Exclude<TeamRole, 'owner'>>('read_only')
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteNotice, setInviteNotice] = useState<string | null>(null)
  const [lastAcceptUrl, setLastAcceptUrl] = useState<string | null>(null)
  const [billing, setBilling] = useState<BillingAccountStatus | null>(null)
  const { team, reload: reloadTeam, canManage, canInvite, error: teamError } = useTeam()

  useEffect(() => {
    if (!user) return
    setFirstName(user.firstName)
    setLastName(user.lastName)
    setCompany(user.company)
  }, [user])

  useEffect(() => {
    getBillingStatus()
      .then(setBilling)
      .catch(() => setBilling(null))
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
  const seatsLimit = team?.seats.limit ?? billing?.limits.seats
  const seatsUsed = team?.seats.used
  const planName = billingReady && activePlan ? planLabel(activePlan) : 'Billing unavailable'

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
          <div className="flex items-start justify-between gap-4 overflow-hidden rounded-xl border border-slate-200 bg-white px-5 py-5">
            <div className="min-w-0">
              <p className="text-[14px] font-semibold" style={{ color: NAVY }}>
                {planName}
              </p>
              <p className="mt-1 text-[12px] text-slate-500">
                {seatsUsed != null ? `${seatsUsed} / ${seatsLimit ?? '—'} seats` : 'Seats loading…'}
                {billing?.usage.active_boms_count != null && billing.limits.active_boms != null
                  ? ` · ${billing.usage.active_boms_count} / ${billing.limits.active_boms} BOMs`
                  : ''}
                {' '}
                from the team and billing APIs. Full meters live on the billing page.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate('/billing')}
                className="rounded-lg px-3.5 py-1.5 text-[12px] font-semibold text-white"
                style={{ background: BLUE }}
              >
                Open billing
              </button>
              <button
                type="button"
                onClick={() => navigate('/billing?plans=1')}
                className="rounded-lg border px-3.5 py-1.5 text-[12px] font-semibold"
                style={{ color: BLUE, borderColor: '#bfdbfe' }}
              >
                Compare plans
              </button>
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
            {seatsUsed != null
              ? `${seatsUsed} / ${seatsLimit ?? '—'} seats${
                  billingReady && activePlan ? ` on ${shortPlanLabel(activePlan)}` : ''
                }.`
              : 'Team seats loading…'}
            {team ? ` Your role: ${roleLabel(team.role)}.` : ''}
            {!canInvite && activePlan === 'free'
              ? ' Upgrade before inviting teammates.'
              : !canInvite && seatsLimit != null && seatsUsed != null && seatsUsed >= seatsLimit
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
                  {initialsForEmail(member.email ?? member.user_id)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium" style={{ color: NAVY }}>
                    {member.email || member.user_id}
                    {member.user_id === team?.user_id ? ' (you)' : ''}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">{member.user_id}</p>
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
