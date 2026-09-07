'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { displayNameForUser, initialsForUser, updateProfile } from '@/lib/auth'
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
import PageHeader from '@/components/app/PageHeader'
import { appField, appGhostBtn, appPage, appPrimaryBtn, appSheet } from '@/components/app/chrome'

function InputField({
  label,
  value,
  onChange,
  readOnly = false,
  placeholder,
  type = 'text',
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
      <label className="mk-eyebrow mb-1.5 block">{label}</label>
      <input
        type={type}
        readOnly={readOnly}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        className={`${appField} ${readOnly ? 'cursor-default bg-mk-raised text-mk-ink-subtle' : ''}`}
      />
    </div>
  )
}

function planLabel(plan: BillingAccountStatus['plan']) {
  return `${shortPlanLabel(plan)} Plan`
}

function inviteDeliveryNotice(invite: {
  email: string
  email_delivery?: string
  email_error?: string | null
}) {
  switch (invite.email_delivery) {
    case 'sent':
      return `Invite email sent to ${invite.email}.`
    case 'queued':
      return `Invite queued for ${invite.email}. Copy the link below if it does not arrive.`
    case 'failed':
      return invite.email_error
        ? `Invite created but email failed: ${invite.email_error}. Copy the link below.`
        : 'Invite created but email delivery failed. Copy the link below.'
    default:
      return 'Invite created. Copy the link below and share it with your teammate.'
  }
}

function roleLabel(role: TeamRole) {
  if (role === 'read_only') return 'Can view'
  if (role === 'admin') return 'Can edit'
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

  const handleCancel = () => {
    if (!user) return
    setFirstName(user.firstName)
    setLastName(user.lastName)
    setCompany(user.company)
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-mk-raised font-mk-sans text-[13px] text-mk-ink-subtle">
        Loading…
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-mk-raised font-mk-sans text-[13px] text-mk-ink-subtle">
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
  const planName = billingReady && activePlan ? planLabel(activePlan) : 'Plan unavailable'

  return (
    <div className={appPage}>
      <PageHeader
        kicker="Account"
        title="You and your team"
        description={`${planName}${
          seatsUsed != null ? ` · ${seatsUsed} / ${seatsLimit ?? '—'} people` : ''
        }`}
      />

      <div className="mx-auto grid max-w-[1180px] gap-8 px-6 py-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-mk-display text-[22px] text-mk-ink">You</h2>
          <div className={appSheet}>
            <div className="flex items-center gap-4 border-b border-mk-line px-5 py-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[8px] bg-mk-ink text-lg font-semibold text-mk-canvas">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[16px] font-semibold text-mk-ink">{displayName || user.email}</p>
                <p className="truncate text-[13px] text-mk-ink-muted">{user.email}</p>
              </div>
            </div>
            <div className="space-y-4 px-5 py-5">
              <div className="grid grid-cols-2 gap-3">
                <InputField label="First name" value={firstName} onChange={setFirstName} />
                <InputField label="Last name" value={lastName} onChange={setLastName} />
              </div>
              <InputField label="Work email" value={user.email} readOnly type="email" />
              <InputField label="Company" value={company} onChange={setCompany} placeholder="Your company" />
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-mk-line bg-mk-raised px-5 py-3">
              <button type="button" onClick={handleCancel} disabled={saving} className={appGhostBtn}>
                Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={saving} className={appPrimaryBtn}>
                {saved ? 'Saved' : saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-mk-display text-[22px] text-mk-ink">Team</h2>
          {teamError && !team ? (
            <div className="mb-3 border border-mk-amber/30 bg-mk-canvas px-3 py-2 text-[12px] text-mk-ink">
              Could not load the team ({teamError}).{' '}
              <button type="button" className="font-semibold underline" onClick={() => reloadTeam()}>
                Retry
              </button>
            </div>
          ) : teamError ? (
            <div className="mb-3 border border-mk-amber/30 bg-mk-canvas px-3 py-2 text-[12px] text-mk-ink">
              Team refresh failed ({teamError}). Showing last known people.{' '}
              <button type="button" className="font-semibold underline" onClick={() => reloadTeam()}>
                Retry
              </button>
            </div>
          ) : null}
          <p className="mb-3 text-[13px] text-mk-ink-muted">
            {seatsUsed != null
              ? `${seatsUsed} of ${seatsLimit ?? '—'} seats in use.`
              : 'Seats loading…'}
            {team ? ` You are ${roleLabel(team.role).toLowerCase()}.` : ''}
            {!canInvite && activePlan === 'free'
              ? ' Upgrade before inviting people.'
              : !canInvite && seatsLimit != null && seatsUsed != null && seatsUsed >= seatsLimit
                ? ' All seats are in use — revoke a pending invite or add seats on Plan.'
                : ''}
          </p>
          <div className={appSheet}>
            {(team?.members ?? []).map((member) => (
              <div key={member.user_id} className="flex items-center gap-3 border-b border-mk-line px-5 py-4 last:border-b-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-mk-ink text-xs font-semibold text-mk-canvas">
                  {memberInitials(member)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-mk-ink">
                    {memberDisplayName(member)}
                    {member.user_id === team?.user_id ? ' (you)' : ''}
                  </p>
                  <p className="truncate text-[11px] text-mk-ink-subtle">{member.email || member.user_id}</p>
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
                    className="rounded-[8px] border border-mk-line bg-mk-canvas px-2 py-0.5 text-[11px] text-mk-ink"
                  >
                    <option value="read_only">Can view</option>
                    <option value="admin">Can edit</option>
                  </select>
                ) : (
                  <span className="px-2 py-0.5 text-[11px] text-mk-ink-muted">{roleLabel(member.role)}</span>
                )}
                {canManage && member.role !== 'owner' ? (
                  <button
                    type="button"
                    className="text-[11px] font-medium text-mk-ink-subtle hover:text-mk-red"
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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-mk-ink text-xs font-semibold text-mk-canvas">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-mk-ink">{displayName || user.email}</p>
                  <p className="truncate text-[11px] text-mk-ink-subtle">{user.email}</p>
                </div>
                <span className="text-[11px] text-mk-ink-muted">Owner</span>
              </div>
            ) : null}

            {(team?.invites ?? []).map((invite: TeamInvite) => (
              <div key={invite.id} className="flex items-center gap-3 border-t border-mk-line px-5 py-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-mk-amber/15 text-[10px] font-bold text-mk-amber">
                  …
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-mk-ink">{invite.email}</p>
                  <p className="truncate text-[11px] text-mk-ink-subtle">
                    Waiting · {roleLabel(invite.role)} · expires {new Date(invite.expires_at).toLocaleDateString()}
                  </p>
                  {invite.accept_url ? (
                    <button
                      type="button"
                      className="mt-1 text-[11px] font-semibold text-mk-accent hover:underline"
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
                    className="text-[11px] font-medium text-mk-ink-subtle hover:text-mk-red"
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
              <div className="border-t border-mk-line bg-mk-raised px-5 py-5">
                <p className="mb-1 text-[13px] font-medium text-mk-ink">Invite someone</p>
                <p className="mb-3 text-[12px] text-mk-ink-muted">
                  They get an email with a link. Copy it yourself if the mail is slow.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className={`${appField} flex-1`}
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as Exclude<TeamRole, 'owner'>)}
                    className={appField}
                  >
                    <option value="read_only">Can view</option>
                    <option value="admin">Can edit</option>
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
                    className={appPrimaryBtn}
                  >
                    {inviteBusy ? 'Sending…' : 'Invite'}
                  </button>
                </div>
                {inviteNotice ? <p className="mt-2 text-[12px] text-mk-green">{inviteNotice}</p> : null}
                {inviteError ? <p className="mt-2 text-[12px] text-mk-red">{inviteError}</p> : null}
                {lastAcceptUrl ? (
                  <div className="mt-3 rounded-[8px] border border-mk-line bg-mk-canvas px-3 py-2">
                    <p className="text-[11px] font-medium text-mk-ink-muted">Invite link</p>
                    <a
                      href={lastAcceptUrl}
                      className="mt-1 block break-all text-[12px] font-medium text-mk-accent hover:underline"
                    >
                      {lastAcceptUrl}
                    </a>
                    <button
                      type="button"
                      className="mt-2 text-[11px] font-semibold text-mk-ink-muted hover:text-mk-accent"
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
              <div className="border-t border-mk-line px-5 py-4">
                <p className="text-[12px] text-mk-red">{inviteError}</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}
